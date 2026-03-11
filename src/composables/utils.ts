/**
 * Utility functions for skills-manager
 */

/**
 * Validates if a path is a safe relative path (not absolute, no parent directory traversal)
 */
export function isSafeRelativePath(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") || /^[A-Za-z]:/i.test(trimmed) || trimmed.startsWith("\\")) {
    return false;
  }
  const parts = trimmed.split(/[\\/]+/);
  return parts.every((part) => part !== ".." && part !== "");
}

/**
 * Checks if a path is a WSL UNC path
 * Examples: \\wsl$\Ubuntu\..., \\wsl.localhost\Ubuntu\...
 */
export function isWslPath(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return trimmed.startsWith("\\\\wsl$\\") || trimmed.startsWith("\\\\wsl.localhost\\");
}

/**
 * Validates if an absolute path is safe to use
 * - Unix absolute paths: /home/user/...
 * - Windows absolute paths: C:\Users\...
 * - WSL UNC paths: \\wsl$\Ubuntu\... or \\wsl.localhost\Ubuntu\...
 */
export function isSafeAbsolutePath(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // WSL UNC paths
  if (isWslPath(trimmed)) {
    return true;
  }

  // Unix absolute path
  if (trimmed.startsWith("/")) {
    // Disallow dangerous paths
    const dangerous = ["/etc", "/sys", "/proc", "/dev", "/root"];
    return !dangerous.some((d) => trimmed === d || trimmed.startsWith(d + "/"));
  }

  // Windows absolute path (e.g., C:\...)
  if (/^[A-Za-z]:[/\\]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Validates a path - supports both relative and absolute paths
 */
export function isValidIdePath(input: string): boolean {
  return isSafeRelativePath(input) || isSafeAbsolutePath(input);
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return fallback;
}