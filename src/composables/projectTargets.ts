import type { LinkTarget, ProjectConfig } from "./types";
import { ideDirMappings } from "./constants";

export function buildProjectLinkTargets(
  project: ProjectConfig,
  ideLabel: string
): LinkTarget[] {
  const detectedDir = project.detectedIdeDirs.find((item) => item.label === ideLabel);
  if (detectedDir) {
    const normalizedPath = detectedDir.absolutePath?.trim() || `${project.path}/${detectedDir.relativeDir}`;
    return [{ name: `${ideLabel} (${project.name})`, path: normalizedPath }];
  }

  const targetMapping = ideDirMappings.find((option) => option.label === ideLabel);
  if (!targetMapping) return [];

  const dir = targetMapping.path.trim();
  if (!dir || dir.startsWith("/")) {
    return [];
  }

  return [{ name: `${ideLabel} (${project.name})`, path: `${project.path}/${dir}` }];
}
