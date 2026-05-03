#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import {
  ApiError,
  find,
  inspect,
  registerInstall,
  report,
  submitGitHub,
  submitInline,
  type SearchResult
} from "./api.js";
import { cliVersion, configExists, configPath, loadConfig, loadOrCreate, saveConfig } from "./config.js";
import { detectEnvironment } from "./env.js";
import { collectFolder, describeRelative, parseFrontmatter } from "./folder.js";

const program = new Command();
program
  .name("upskill")
  .description("Search, inspect, report on, and publish agent skills from the autoloops registry.")
  .version(cliVersion(), "-v, --version");

function ctx() {
  const cfg = loadOrCreate();
  return { cfg, cliVersion: cliVersion() };
}

async function ask(question: string, fallback: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const ans = (await rl.question(question)).trim();
    return ans || fallback;
  } finally {
    rl.close();
  }
}

async function askYesNo(question: string, defaultYes: boolean): Promise<boolean> {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]";
  const ans = (await ask(`${question} ${suffix} `, defaultYes ? "y" : "n")).toLowerCase();
  if (ans === "" || ans === (defaultYes ? "y" : "n")) return defaultYes;
  return ans === "y" || ans === "yes";
}

// ---- install ------------------------------------------------------------

program
  .command("install")
  .description("Set up this CLI: pick consent options and register your install.")
  .option("--telemetry <bool>", "skip the prompt and set telemetry up-front (true/false)")
  .option("--submissions <bool>", "skip the prompt and set submissions up-front (true/false)")
  .option("--context <bool>", "skip the prompt and set auth-aware ranking up-front (true/false)")
  .option("--non-interactive", "fail if any required answer is missing instead of prompting")
  .action(async (opts: { telemetry?: string; submissions?: string; context?: string; nonInteractive?: boolean }) => {
    const cfg = loadOrCreate();
    if (configExists()) {
      console.log(`Existing config at ${configPath()}`);
      console.log(`  installId: ${cfg.installId}`);
      console.log(`  serverUrl: ${cfg.serverUrl}`);
      console.log(`  telemetry: ${cfg.telemetryEnabled}`);
      console.log(`  submissions: ${cfg.submissionsEnabled}`);
      console.log(`  context: ${cfg.contextEnabled ?? false}`);
    }
    const parseBool = (v: string | undefined): boolean | undefined => {
      if (v === undefined) return undefined;
      const s = v.toLowerCase();
      if (s === "true" || s === "yes" || s === "y" || s === "1") return true;
      if (s === "false" || s === "no" || s === "n" || s === "0") return false;
      return undefined;
    };
    let telemetry = parseBool(opts.telemetry);
    let submissions = parseBool(opts.submissions);
    let context = parseBool(opts.context);

    if (telemetry === undefined) {
      if (opts.nonInteractive) throw new Error("--telemetry required in non-interactive mode");
      console.log("");
      console.log("─── Outcome telemetry (off by default) ───────────────────────────────");
      console.log("What it does: each time your agent runs `upskill report`, it sends");
      console.log("  the registry a single line saying whether the skill worked.");
      console.log("What's sent: skill_id, outcome (success | failure | partial), an");
      console.log("  optional 1-word error code (e.g. missing_dep:playwright), and a");
      console.log("  task kind tag (e.g. webapp-testing). Nothing else.");
      console.log("What's NOT sent: your install ID is not linked to outcomes; no file");
      console.log("  paths, no command output, no prompts, no environment, no IP-level");
      console.log("  identifiers beyond a TLS request.");
      console.log("Why turn it on: failed skills rank down and good skills rank up for");
      console.log("  every agent on every machine. The registry gets smarter the more");
      console.log("  agents close the loop. You can flip it off any time.");
      console.log("");
      telemetry = await askYesNo("Enable outcome telemetry?", false);
    }
    if (context === undefined) {
      if (opts.nonInteractive) throw new Error("--context required in non-interactive mode");
      console.log("");
      console.log("─── Share environment for better recommendations (off by default) ────");
      console.log("What it does: with each `upskill find`, sends the registry a list of");
      console.log("  CLIs you have installed (git, gh, aws, kubectl, terraform, docker,");
      console.log("  playwright, ...) plus a list of environment-variable NAMES that are");
      console.log("  set (OPENAI_API_KEY, GITHUB_TOKEN, AWS_ACCESS_KEY_ID, STRIPE_*, ...).");
      console.log("  The registry uses this to recommend skills you can actually run.");
      console.log("What's sent: NAMES only — never values. No file contents, no shell");
      console.log("  history, no command output. The full pattern list is published at");
      console.log("  github.com/Autoloops/upskill/blob/main/cli/src/env.ts");
      console.log("Why turn it on: AWS deploy skills outrank generic ones when you have");
      console.log("  aws + AWS_*; Stripe checkout outranks generic 'payment' skills when");
      console.log("  STRIPE_SECRET_KEY is set. Recommendations match your real stack.");
      console.log("");
      context = await askYesNo("Share installed CLIs + env-var NAMES (never values)?", false);
    }
    if (submissions === undefined) {
      if (opts.nonInteractive) throw new Error("--submissions required in non-interactive mode");
      console.log("");
      console.log("─── Submit (off by default) ──────────────────────────────────────────");
      console.log("What it does: turns on the `upskill submit` command, which lets your");
      console.log("  agent publish a skill folder (a directory with a SKILL.md) to the");
      console.log("  public registry. Your agent will always ask you before submitting.");
      console.log("What's sent (only when YOU run submit): the skill folder's contents");
      console.log("  (SKILL.md + companion files) plus the source GitHub URL if any.");
      console.log("  Nothing is sent unless you explicitly run `upskill submit`.");
      console.log("Why turn it on: useful only if you expect to publish skills. Most");
      console.log("  users keep this off and turn it on the day they need it.");
      console.log("");
      submissions = await askYesNo("Enable upskill submit?", false);
    }

    cfg.telemetryEnabled = telemetry;
    cfg.submissionsEnabled = submissions;
    cfg.contextEnabled = context;
    cfg.cliVersion = cliVersion();
    // Probe the local environment once at install time so subsequent find calls
    // can downrank skills the user can't run (missing commands, missing auth
    // env vars). Probe runs unconditionally; the snapshot is only SENT to the
    // server when contextEnabled is true. Only NAMES are sent — no env values
    // ever leave the machine.
    cfg.environment = detectEnvironment();
    cfg.environmentRefreshedAt = new Date().toISOString();
    saveConfig(cfg);

    try {
      await registerInstall(
        { cfg, cliVersion: cliVersion() },
        { telemetry_enabled: telemetry, submissions_enabled: submissions, platform: cfg.platform }
      );
    } catch (err) {
      console.warn(`(register call failed: ${(err as Error).message} — your local config is saved; we'll register on the next call)`);
    }

    console.log("");
    console.log("Setup complete.");
    console.log(`  config: ${configPath()}`);
    console.log(`  install id: ${cfg.installId}`);
    console.log(`  telemetry: ${telemetry ? "enabled" : "disabled"}`);
    console.log(`  context (auth-aware ranking): ${context ? "enabled" : "disabled"}`);
    console.log(`  submissions: ${submissions ? "enabled" : "disabled"}`);
    console.log("");
    console.log("Try it:");
    console.log('  upskill find "deploy a node app to AWS"');
  });

// ---- find ---------------------------------------------------------------

program
  .command("find <query...>")
  .description("Search the registry; returns skills ranked by hybrid relevance + popularity.")
  .option("-n, --limit <n>", "max results", (v) => parseInt(v, 10), 5)
  .option("--json", "emit machine-readable JSON instead of the table view")
  .option("--no-env", "skip sending the cached environment context (default sends it)")
  .option("--refresh-env", "re-probe the local environment now and persist before searching")
  .action(async (queryParts: string[], options: { limit: number; json?: boolean; env?: boolean; refreshEnv?: boolean }) => {
    const c = ctx();
    const query = queryParts.join(" ").trim();
    if (!query) throw new Error("query is required");
    let environment = c.cfg.environment;
    if (options.refreshEnv || !environment) {
      environment = detectEnvironment();
      c.cfg.environment = environment;
      c.cfg.environmentRefreshedAt = new Date().toISOString();
      saveConfig(c.cfg);
    }
    // Send the env snapshot only when the user opted into auth-aware ranking
    // (cfg.contextEnabled). --no-env always wins as an explicit override.
    const sendEnv = options.env !== false && c.cfg.contextEnabled === true;
    const result = await find(c, {
      query,
      limit: options.limit,
      environment: sendEnv ? environment : undefined
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (!result.results.length) {
      console.log("(no results)");
      return;
    }
    for (const r of result.results) {
      printResult(r);
    }
  });

function printResult(r: SearchResult) {
  const trust = r.trust_level ?? "?";
  const tDot = " ".repeat(Math.max(1, 40 - r.name.length));
  console.log(`\n${r.name}${tDot}[${trust}]  score=${r.score.toFixed(3)}  text=${r.match_reason.text_score.toFixed(3)}  vec=${r.match_reason.vector_sim.toFixed(3)}`);
  console.log(`  ${r.skill_id}`);
  console.log(`  ${truncate(r.description, 200)}`);
  if (r.distribution) {
    console.log(`  → ${r.distribution.repo_url}/tree/${r.distribution.ref.slice(0, 7)}/${r.distribution.path}`);
  }
  if (r.missing_dependencies?.length) {
    console.log(`  ⚠ missing: ${r.missing_dependencies.map((d) => `${d.type}:${d.name}`).join(", ")}`);
  }
  if (r.warnings?.length) {
    console.log(`  ⚠ warnings: ${r.warnings.join(", ")}`);
  }
  console.log(`  inspect: upskill inspect ${r.skill_id}`);
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ---- inspect ------------------------------------------------------------

program
  .command("inspect <skillIdOrVersionId>")
  .description("Fetch the full SKILL.md and metadata for a skill.")
  .option("--json", "emit machine-readable JSON")
  .option("--md", "print only the SKILL.md body (no metadata)")
  .action(async (idOrVer: string, options: { json?: boolean; md?: boolean }) => {
    const c = ctx();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrVer);
    const result = await inspect(c, isUuid ? { skill_version_id: idOrVer } : { skill_id: idOrVer });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (options.md) {
      console.log(result.skill_md);
      return;
    }
    console.log(`# ${result.name}`);
    console.log(`  skill_id: ${result.skill_id}`);
    console.log(`  version : ${result.skill_version_id}`);
    console.log(`  trust   : ${result.trust_level}`);
    console.log(`  source  : ${result.source_url}`);
    if (result.metrics?.github_stars !== null && result.metrics?.github_stars !== undefined) {
      console.log(`  metrics : ${result.metrics.github_stars} stars · license=${result.metrics.github_license ?? "?"}`);
    }
    console.log("");
    console.log("--- SKILL.md ---");
    console.log(result.skill_md);
  });

// ---- report -------------------------------------------------------------

program
  .command("report <skillVersionId>")
  .description("Send a feedback signal after using a skill. No-op if telemetry is disabled.")
  .option("--outcome <value>", "success | failure | partial", "success")
  .option("--code <code...>", "failure or workaround code (repeatable)", [] as string[])
  .option("--workaround <code...>", "workaround code (repeatable)", [] as string[])
  .option("--task <type>", "task type label", "general")
  .option("--agent <name>", "agent name (defaults to client_name in config)", "")
  .action(async (skillVersionId: string, options: { outcome: "success" | "failure" | "partial"; code: string[]; workaround: string[]; task: string; agent: string }) => {
    const c = ctx();
    if (!c.cfg.telemetryEnabled) {
      console.log("(telemetry disabled — no-op. Re-enable with: upskill config set telemetry true)");
      return;
    }
    const failureCodes = options.outcome === "success" ? [] : options.code ?? [];
    const workaroundCodes = options.workaround ?? [];
    const result = await report(c, {
      skill_version_id: skillVersionId,
      outcome: options.outcome,
      agent: options.agent || "upskill",
      task_type: options.task,
      failure_codes: failureCodes,
      workaround_codes: workaroundCodes
    });
    console.log(`reported ${options.outcome} for ${skillVersionId} → ${result.feedback_id}`);
  });

// ---- submit -------------------------------------------------------------

program
  .command("submit <pathOrRepoUrl>")
  .description("Publish a skill. Pass a local folder containing SKILL.md, or a github URL.")
  .option("--ref <ref>", "git ref (only when submitting a github URL)", "main")
  .option("--license <license>", "license string (e.g. MIT)")
  .action(async (pathOrUrl: string, options: { ref: string; license?: string }) => {
    const c = ctx();
    if (!c.cfg.submissionsEnabled) {
      console.log("(submissions disabled — no-op. Re-enable with: upskill config set submissions true)");
      return;
    }
    if (/^https?:\/\/github\.com\//.test(pathOrUrl)) {
      const m = pathOrUrl.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/tree\/([^/]+)\/(.+))?\/?$/i);
      if (!m) throw new Error("could not parse github URL");
      const repo = `https://github.com/${m[1]}`;
      const ref = m[2] ?? options.ref;
      const path = m[3] ?? "";
      const result = await submitGitHub(c, { github_repo: repo, github_path: path, github_ref: ref });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // local folder
    const folder = await collectFolder(pathOrUrl);
    console.log(`packaging ${describeRelative(pathOrUrl)} → ${folder.files.length + 1} files, ${folder.totalBytes} bytes`);
    const fm = folder.frontmatter;
    const result = await submitInline(c, {
      name: fm.name,
      description: fm.description,
      skill_md: folder.skillMdContent,
      files: folder.files,
      license: options.license ?? fm.license
    });
    console.log(JSON.stringify(result, null, 2));
  });

// ---- config -------------------------------------------------------------

const configCmd = program.command("config").description("Inspect or change the local CLI config.");
configCmd
  .command("show")
  .description("Print the local config file path and contents.")
  .action(() => {
    const cfg = loadConfig();
    console.log(`config: ${configPath()}`);
    if (!cfg) {
      console.log("(not initialized — run `upskill install`)");
      return;
    }
    console.log(JSON.stringify(cfg, null, 2));
  });

configCmd
  .command("set <key> <value>")
  .description("Set a config field. Allowed keys: telemetry, submissions, context, server.")
  .action((key: string, value: string) => {
    const cfg = loadOrCreate();
    const k = key.toLowerCase();
    if (k === "telemetry") cfg.telemetryEnabled = parseBoolStrict(value);
    else if (k === "submissions") cfg.submissionsEnabled = parseBoolStrict(value);
    else if (k === "context") cfg.contextEnabled = parseBoolStrict(value);
    else if (k === "server" || k === "serverurl") cfg.serverUrl = value;
    else throw new Error(`unknown config key: ${key}`);
    saveConfig(cfg);
    console.log(`set ${k} = ${value}`);
  });

function parseBoolStrict(v: string): boolean {
  const s = v.toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "no" || s === "0") return false;
  throw new Error(`expected true|false, got ${v}`);
}

// ---- run ----------------------------------------------------------------

void parseFrontmatter; // keep import live for tooling

program.parseAsync().catch((err: unknown) => {
  if (err instanceof ApiError) {
    console.error(`error: ${err.message}`);
    if (err.body) console.error(JSON.stringify(err.body, null, 2));
    process.exit(2);
  }
  console.error(`error: ${(err as Error).message}`);
  process.exit(1);
});
