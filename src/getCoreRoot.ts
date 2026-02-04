import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

let coreRoot: string | null = null;

/**
 * Returns the root directory of the "core" package (app + templates + public).
 * - When running from the project root: returns process.cwd().
 * - When running from packages/map-starter-kit-core or node_modules: returns the package directory.
 * Allows updating the core package without touching user files (maps, .env, tilesets).
 */
export function getCoreRoot(): string {
    if (coreRoot !== null) {
        return coreRoot;
    }
    try {
        const dir = path.dirname(fileURLToPath(import.meta.url));
        const candidate = path.dirname(dir);
        const packagePath = path.join(candidate, "package.json");
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
            if (pkg.name === "@workadventure/map-starter-kit-core") {
                coreRoot = candidate;
                return coreRoot;
            }
        }
    } catch {
        // ignore
    }
    coreRoot = process.cwd();
    return coreRoot;
}

/**
 * Override the core root (e.g. for tests or custom layout).
 */
export function setCoreRoot(root: string): void {
    coreRoot = root;
}
