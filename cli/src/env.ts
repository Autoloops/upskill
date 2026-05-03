import { execSync } from "node:child_process";
import { platform } from "node:os";

export interface DetectedEnvironment {
  os: string;
  available_commands: string[];
  available_env_vars: string[];
  package_managers: string[];
  agent: string;
}

const COMMANDS_TO_PROBE = [
  "git", "gh", "node", "npm", "pnpm", "yarn", "bun", "tsx",
  "python", "python3", "pip", "pip3", "uv",
  "docker", "kubectl", "helm",
  "go", "cargo", "ruby", "gem",
  "aws", "gcloud", "az", "terraform",
  "psql", "redis-cli",
  "playwright", "cypress",
  "rg", "jq", "curl"
];

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun", "pip", "pip3", "uv", "cargo", "gem", "go"];

// Env-var names that commonly indicate "user has auth for service X". We send
// the NAMES only, never the values, so the registry can score skills that need
// matching auth.
const AUTH_ENV_PATTERNS: RegExp[] = [
  /_TOKEN$/, /_KEY$/, /_SECRET$/, /_API_KEY$/, /_ACCESS_KEY/, /_PASSWORD$/,
  /^GITHUB_TOKEN$/, /^OPENAI_API_KEY$/, /^ANTHROPIC_API_KEY$/,
  /^AWS_ACCESS_KEY_ID$/, /^AWS_SECRET_ACCESS_KEY$/, /^AWS_SESSION_TOKEN$/, /^AWS_PROFILE$/,
  /^GCLOUD/, /^GOOGLE_/, /^AZURE_/,
  /^DATABASE_URL$/, /^REDIS_URL$/,
  /^STRIPE_/, /^TWILIO_/, /^SENDGRID_/
];

function which(cmd: string): boolean {
  try {
    const probe = process.platform === "win32" ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(probe, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function detectEnvironment(opts: { agent?: string } = {}): DetectedEnvironment {
  const available_commands = COMMANDS_TO_PROBE.filter(which);
  const available_env_vars: string[] = [];
  for (const name of Object.keys(process.env)) {
    if (AUTH_ENV_PATTERNS.some((p) => p.test(name))) available_env_vars.push(name);
  }
  available_env_vars.sort();
  const package_managers = PACKAGE_MANAGERS.filter((pm) => available_commands.includes(pm));
  return {
    os: platform(),
    available_commands,
    available_env_vars,
    package_managers,
    agent: opts.agent ?? "upskill"
  };
}
