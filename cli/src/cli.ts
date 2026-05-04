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

    // Apply explicit flags only. No interactive prompts — `upskill install`
    // always writes a defaults-off config silently, then prints next steps.
    // The agent (or human) opts into individual features by running
    // `upskill config set <key> true` after asking the user in plain English.
    cfg.telemetryEnabled = telemetry ?? false;
    cfg.submissionsEnabled = submissions ?? false;
    cfg.contextEnabled = context ?? false;
    // Default search scope is "verified" (most restrictive) — user has to
    // explicitly opt UP into reviewed or community via `upskill config set
    // search-scope reviewed|community` after install. Existing configs
    // upgrading from <0.8 land here too.
    cfg.searchScope = cfg.searchScope ?? "verified";
    cfg.cliVersion = cliVersion();
    // Probe the local environment once at install time. The snapshot is only
    // SENT when contextEnabled is true. Only NAMES are sent — never values.
    cfg.environment = detectEnvironment();
    cfg.environmentRefreshedAt = new Date().toISOString();
    saveConfig(cfg);

    try {
      await registerInstall(
        { cfg, cliVersion: cliVersion() },
        { telemetry_enabled: cfg.telemetryEnabled, submissions_enabled: cfg.submissionsEnabled, platform: cfg.platform }
      );
    } catch (err) {
      console.warn(`(register call failed: ${(err as Error).message} — your local config is saved; we'll register on the next call)`);
    }

    console.log("");
    console.log(`Installed @ ${configPath()}.  Three privacy opt-ins (all off) + one search scope:`);
    console.log(`  telemetry      = ${cfg.telemetryEnabled}`);
    console.log(`  context        = ${cfg.contextEnabled}`);
    console.log(`  submissions    = ${cfg.submissionsEnabled}`);
    console.log(`  search-scope   = ${cfg.searchScope}   ${cfg.searchScope === "verified" ? "(default — vendor-official only)" : cfg.searchScope === "reviewed" ? "(verified + curated practitioners)" : "(everything in the registry)"}`);
    console.log("");
    console.log("─── If you're the AI agent that just ran this: ───────────────────────");
    console.log("Ask the user each of these three questions in plain English, then");
    console.log("apply each YES via `upskill config set <key> true`:");
    console.log("");
    console.log("1. \"Want upskill to send back whether each skill worked for you, so");
    console.log("    failed skills rank down and good ones rank up for everyone?");
    console.log("    What's sent: skill_id, success/failure, optional error code,");
    console.log("    task kind. Nothing identifying. Default: off.\"");
    console.log("    → if yes:  upskill config set telemetry true");
    console.log("");
    console.log("2. \"Want upskill to share which CLIs you have installed and which");
    console.log("    env-var NAMES are set (never values), so it can recommend skills");
    console.log("    you can actually run on your stack? Default: off.\"");
    console.log("    → if yes:  upskill config set context true");
    console.log("");
    console.log("3. \"Want to enable `upskill submit` so I can publish skills I build");
    console.log("    during a task? I'll always confirm before publishing. Default: off.\"");
    console.log("    → if yes:  upskill config set submissions true");
    console.log("");
    console.log("4. \"Search scope: which trust tiers should `upskill find` look at?");
    console.log("    The default is the strictest tier — you opt UP into looser ones.");
    console.log("");
    console.log("       a. verified   = vendor-official only (Anthropic, OpenAI, Stripe,");
    console.log("                       Microsoft, Cloudflare, Sentry, Datadog, Clerk,");
    console.log("                       Vercel-Labs, Neon, ClickHouse, Sanity, etc.) [DEFAULT]");
    console.log("       b. reviewed   = verified + curated practitioners");
    console.log("                       (obra/superpowers, garrytan/gstack, mattpocock,");
    console.log("                       K-Dense-AI scientific skills, etc.)");
    console.log("       c. community  = the full registry, every public submission\"");
    console.log("");
    console.log("    → upskill config set search-scope verified  (or reviewed | community)");
    console.log("");
    console.log("After the four questions:");
    console.log("");
    console.log("5. Run:  npx -y skills add Autoloops/upskill/skill");
    console.log("");
    console.log("6. ASK THE USER (this is the most important step — the SKILL.md alone");
    console.log("   is dormant until something pulls it into context every turn):");
    console.log("");
    console.log("   \"Want me to add a one-line rule to your agent's persistent context");
    console.log("    file so I'll consult upskill before every non-trivial task?");
    console.log("    Without this, the skill exists locally but I'll often forget to use");
    console.log("    it and just go freehand. Highly recommended.\"");
    console.log("");
    console.log("   If YES, locate the rules file in this order (use the first that");
    console.log("   exists; ask the user which to use if multiple exist):");
    console.log("     - ./CLAUDE.md, ./AGENTS.md, ./.cursorrules, ./.clinerules, ./.windsurfrules");
    console.log("     - ~/.claude/CLAUDE.md (global Claude Code rules)");
    console.log("   If none exists, ask the user which to create. Then APPEND this");
    console.log("   exact block (don't overwrite the file; idempotent — skip if already");
    console.log("   present):");
    console.log("");
    console.log("   ─── snip ───");
    console.log("   ## upskill (skill registry)");
    console.log("   Before any non-trivial task — anything beyond a one-line edit or");
    console.log("   trivial answer — run `upskill find \"<plain-language description of");
    console.log("   the task>\"` first. If a result has a strong match (score > 1.4 or");
    console.log("   name_match > 0), inspect it with `upskill inspect <skill_id>` and");
    console.log("   follow the SKILL.md instead of going freehand. After the task,");
    console.log("   call `upskill report <ver> --outcome success|failure --task <kind>`.");
    console.log("   ─── snip ───");
    console.log("");
    console.log("   Then confirm to the user: \"Wired upskill into <path>.\"");
    console.log("──────────────────────────────────────────────────────────────────────");
    console.log("");
    console.log("Inspect anytime:  upskill config show");
    console.log(`Try it:           upskill find "deploy a node app to AWS"`);
  });

// ---- find ---------------------------------------------------------------

program
  .command("find <query...>")
  .description("Search the registry; returns skills ranked by hybrid relevance + popularity.")
  .option("-n, --limit <n>", "max results", (v) => parseInt(v, 10), 5)
  .option("--json", "emit machine-readable JSON instead of the table view")
  .option("--no-env", "skip sending the cached environment context (default sends it)")
  .option("--refresh-env", "re-probe the local environment now and persist before searching")
  .option("--scope <tier>", "override the configured search scope for this call (verified | reviewed | community)")
  .option("--all", "shortcut for --scope community")
  .action(async (queryParts: string[], options: { limit: number; json?: boolean; env?: boolean; refreshEnv?: boolean; scope?: string; all?: boolean }) => {
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
    // Resolve the active scope in priority order: --all > --scope > config.
    // Map the tier to the registry's trust_level_min filter:
    //   verified  → keep verified + official
    //   reviewed  → keep reviewed + verified + official
    //   community → no filter (everything)
    let scope: "verified" | "reviewed" | "community" = c.cfg.searchScope ?? "verified";
    if (options.all) scope = "community";
    else if (options.scope) {
      const v = options.scope.toLowerCase();
      if (v !== "verified" && v !== "reviewed" && v !== "community") {
        throw new Error(`--scope must be one of: verified, reviewed, community (got "${options.scope}")`);
      }
      scope = v;
    }
    // Always send an explicit trust_level_min, even for the "community" tier
    // (which is a no-op filter where every row passes). The server defaults
    // unfiltered requests to "verified" — that's the safe default for older
    // CLIs (<0.9) that don't send filters at all. Sending "community"
    // explicitly tells the server "I want the full registry."
    const filters = { trust_level_min: scope };
    const result = await find(c, {
      query,
      limit: options.limit,
      environment: sendEnv ? environment : undefined,
      filters
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
  .description("Set a config field. Allowed keys: telemetry, submissions, context, search-scope, server.")
  .action((key: string, value: string) => {
    const cfg = loadOrCreate();
    const k = key.toLowerCase();
    if (k === "telemetry") cfg.telemetryEnabled = parseBoolStrict(value);
    else if (k === "submissions") cfg.submissionsEnabled = parseBoolStrict(value);
    else if (k === "context") cfg.contextEnabled = parseBoolStrict(value);
    else if (k === "search-scope" || k === "scope") {
      const v = value.toLowerCase();
      if (v !== "verified" && v !== "reviewed" && v !== "community") {
        throw new Error(`search-scope must be one of: verified, reviewed, community (got "${value}")`);
      }
      cfg.searchScope = v;
    }
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
