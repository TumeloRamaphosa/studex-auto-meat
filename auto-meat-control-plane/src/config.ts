import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function getDatabasePath(): string {
  return process.env.DATABASE_PATH ?? join(packageRoot, "data", "control-plane.sqlite");
}

export function getPort(): number {
  const raw = process.env.PORT ?? "3847";
  const port = Number.parseInt(raw, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return 3847;
  }
  return port;
}

export function getPublicDir(): string {
  if (process.env.PUBLIC_DIR) {
    return process.env.PUBLIC_DIR;
  }
  const fromDist = join(packageRoot, "dist", "public");
  if (existsSync(fromDist)) {
    return fromDist;
  }
  return join(packageRoot, "src", "public");
}
