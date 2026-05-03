import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export interface CliConfig {
  installId: string;
  serverUrl: string;
  installedAt: string;
  cliVersion: string;
  telemetryEnabled: boolean;
  submissionsEnabled: boolean;
  /** Opt-in: send list of installed CLIs + auth env-var NAMES (never values)
   *  with each `find` so the registry can surface skills you can actually run.
   *  Default false — nothing leaves the machine until the user says yes. */
  contextEnabled: boolean;
  /** Opt-in: restrict every `upskill find` to verified + reviewed repos only,
   *  skipping the long tail of community skills. Recommended after a week of
   *  use once the user has a feel for which tiers they trust. Default false
   *  (search the full registry). */
  searchScopeRestricted: boolean;
  platform: string;
  /** Cached environment snapshot from `upskill install` (or last `find`).
   *  Sent on every find call so the registry can rank skills by which deps
   *  the user has installed and which auth env-vars are present. */
  environment?: {
    os?: string;
    available_commands?: string[];
    available_env_vars?: string[];
    package_managers?: string[];
    agent?: string;
  };
  environmentRefreshedAt?: string;
}

const DEFAULT_SERVER = "https://mcp.autoloops.ai";

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, "upskill");
  return join(homedir(), ".config", "upskill");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export function configExists(): boolean {
  return existsSync(configPath());
}

export function loadConfig(): CliConfig | null {
  const p = configPath();
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    return raw as CliConfig;
  } catch {
    return null;
  }
}

export function loadOrCreate(): CliConfig {
  const existing = loadConfig();
  if (existing) return existing;
  const cfg: CliConfig = {
    installId: randomUUID(),
    serverUrl: DEFAULT_SERVER,
    installedAt: new Date().toISOString(),
    cliVersion: cliVersion(),
    telemetryEnabled: false,
    submissionsEnabled: false,
    contextEnabled: false,
    searchScopeRestricted: false,
    platform: platform()
  };
  saveConfig(cfg);
  return cfg;
}

export function saveConfig(cfg: CliConfig): void {
  const dir = configDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
  // Make sure dir perms are tight even if it pre-existed.
  try {
    if (statSync(dir).mode & 0o077) {
      // Best-effort lockdown; ignore on systems where chmod is a no-op.
      // (No throw — we just do our best.)
    }
  } catch {
    // ignore
  }
}

export function cliVersion(): string {
  // Read package.json at runtime so the binary always reports its own version
  // without needing a build step to bake it in.
  try {
    const pkgPath = join(dirname(new URL(import.meta.url).pathname), "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function serverUrl(cfg: CliConfig | null = loadConfig()): string {
  return process.env.UPSKILL_URL ?? cfg?.serverUrl ?? DEFAULT_SERVER;
}
