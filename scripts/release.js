#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const version = args.find((arg) => !arg.startsWith("-"));
const shouldBuild = args.includes("--build");
const shouldPublish = args.includes("--publish");
const shouldPush = args.includes("--push");

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: pnpm release <version> [--build] [--publish] [--push]");
  console.error("Example: pnpm release 0.3.6 --build --publish");
  process.exit(1);
}

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const tauriPath = path.join(root, "src-tauri/tauri.conf.json");
const cargoPath = path.join(root, "src-tauri/Cargo.toml");
const bundleDir = path.join(root, "src-tauri/target/release/bundle");

function run(command, options = {}) {
  execSync(command, {
    cwd: root,
    stdio: "inherit",
    ...options
  });
}

function runQuiet(command) {
  return execSync(command, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  })
    .toString()
    .trim();
}

function bumpVersion(nextVersion) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = nextVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const tauri = JSON.parse(fs.readFileSync(tauriPath, "utf8"));
  tauri.version = nextVersion;
  fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + "\n");

  const cargo = fs.readFileSync(cargoPath, "utf8");
  const nextCargo = cargo.replace(/^version = ".*"$/m, `version = "${nextVersion}"`);
  fs.writeFileSync(cargoPath, nextCargo);
}

function ensureSigningEnv() {
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
    throw new Error("缺少 TAURI_SIGNING_PRIVATE_KEY，无法生成 updater 签名产物。");
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeArch(value) {
  const input = value.toLowerCase();
  if (input.includes("aarch64") || input.includes("arm64")) return "aarch64";
  if (input.includes("x86_64") || input.includes("amd64") || input.includes("x64")) return "x86_64";
  if (input.includes("i686") || input.includes("x86")) return "i686";
  if (input.includes("armv7")) return "armv7";
  return input;
}

function hostArch() {
  switch (process.arch) {
    case "arm64":
      return "aarch64";
    case "x64":
      return "x86_64";
    case "ia32":
      return "i686";
    default:
      return process.arch;
  }
}

function inferPlatformFromFile(filePath) {
  const forcedTarget = process.env.UPDATER_TARGET;
  if (forcedTarget) return forcedTarget;

  const normalized = filePath.replaceAll(path.sep, "/").toLowerCase();
  let osPart = null;
  if (normalized.includes("/macos/")) osPart = "darwin";
  if (normalized.includes("/nsis/") || normalized.includes("/msi/")) osPart = "windows";
  if (normalized.includes("/appimage/") || normalized.includes("/deb/") || normalized.includes("/rpm/")) {
    osPart = "linux";
  }
  if (!osPart) return null;

  const archMatch = normalized.match(/(aarch64|arm64|x86_64|amd64|x64|i686|armv7)/);
  const archPart = normalizeArch(archMatch?.[1] ?? hostArch());
  return `${osPart}-${archPart}`;
}

function artifactPriority(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".app.tar.gz")) return 100;
  if (lower.endsWith(".appimage.tar.gz")) return 95;
  if (lower.endsWith(".appimage")) return 90;
  if (lower.endsWith(".exe")) return 85;
  if (lower.endsWith(".msi.zip")) return 80;
  if (lower.endsWith(".msi")) return 75;
  if (lower.endsWith(".deb")) return 70;
  if (lower.endsWith(".rpm")) return 65;
  return 10;
}

function collectUpdaterArtifacts() {
  const files = listFiles(bundleDir);
  const candidates = new Map();
  const uploadAssets = new Set();

  for (const filePath of files) {
    if (!filePath.endsWith(".sig")) continue;

    const artifactPath = filePath.slice(0, -4);
    if (!fs.existsSync(artifactPath)) continue;

    const platform = inferPlatformFromFile(artifactPath);
    if (!platform) continue;

    const signature = fs.readFileSync(filePath, "utf8").trim();
    const artifact = {
      platform,
      path: artifactPath,
      sigPath: filePath,
      signature,
      assetName: path.basename(artifactPath)
    };

    const existing = candidates.get(platform);
    if (!existing || artifactPriority(artifactPath) > artifactPriority(existing.path)) {
      candidates.set(platform, artifact);
    }

    uploadAssets.add(artifactPath);
    uploadAssets.add(filePath);
  }

  return {
    platforms: Array.from(candidates.values()),
    uploadAssets: Array.from(uploadAssets)
  };
}

function repoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;

  const remote = runQuiet("git remote get-url origin");
  const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) {
    throw new Error("无法从 git remote 推断 GitHub 仓库，请设置 GITHUB_REPOSITORY。");
  }
  return match[1];
}

function changelogNotes(nextVersion) {
  const changelogPath = path.join(root, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) return "";

  const changelog = fs.readFileSync(changelogPath, "utf8");
  const escaped = nextVersion.replaceAll(".", "\\.");
  const match = changelog.match(new RegExp(`##\\s*\\[?v?${escaped}\\]?[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`));
  return match?.[1]?.trim() ?? "";
}

function writeLatestJson(nextVersion) {
  const { platforms, uploadAssets } = collectUpdaterArtifacts();
  if (platforms.length === 0) {
    throw new Error("未找到 updater 产物。请先运行带签名环境变量的 `pnpm tauri build`。");
  }

  const slug = repoSlug();
  const tag = `v${nextVersion}`;
  const notes = changelogNotes(nextVersion);
  const pubDate = new Date().toISOString();

  const latestJson = {
    version: nextVersion,
    notes,
    pub_date: pubDate,
    platforms: Object.fromEntries(
      platforms.map((artifact) => [
        artifact.platform,
        {
          signature: artifact.signature,
          url: `https://github.com/${slug}/releases/download/${tag}/${artifact.assetName}`
        }
      ])
    )
  };

  const latestJsonPath = path.join(bundleDir, "latest.json");
  fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2) + "\n");

  return {
    latestJsonPath,
    assets: [latestJsonPath, ...uploadAssets]
  };
}

function ensureGhCli() {
  try {
    runQuiet("gh --version");
  } catch {
    throw new Error("缺少 GitHub CLI (`gh`) ，无法上传 release 资产。");
  }
}

function publishRelease(nextVersion, assets) {
  ensureGhCli();

  const tag = `v${nextVersion}`;
  const quotedAssets = assets.map((asset) => `"${asset}"`).join(" ");
  let releaseExists = true;
  try {
    runQuiet(`gh release view ${tag}`);
  } catch {
    releaseExists = false;
  }

  if (!releaseExists) {
    run(`gh release create ${tag} ${quotedAssets} --title "${tag}" --generate-notes`);
    return;
  }

  run(`gh release upload ${tag} ${quotedAssets} --clobber`);
}

console.log(`Updated version to ${version}`);
bumpVersion(version);

if (shouldBuild) {
  ensureSigningEnv();
  run("pnpm tauri build");
}

let releaseAssets = [];
if (shouldBuild || shouldPublish) {
  const { latestJsonPath, assets } = writeLatestJson(version);
  releaseAssets = assets;
  console.log(`Generated updater manifest: ${path.relative(root, latestJsonPath)}`);
}

if (shouldPublish) {
  publishRelease(version, releaseAssets);
}

if (shouldPush) {
  const tag = `v${version}`;
  run("git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml");
  try {
    run(`git commit -m "chore(release): v${version}"`);
  } catch {
    console.warn("No changes to commit, skipping commit step.");
  }
  run(`git tag -a ${tag} -m "${tag}"`);
  run("git push origin main --follow-tags");
}
