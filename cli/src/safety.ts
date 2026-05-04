// Outbound-payload safety layer. Every byte the CLI is about to send to the
// registry passes through a check here first. Goal: nothing accidentally
// (or maliciously) leaks. Pure functions, no I/O at top level — easy to test.

import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, basename } from "node:path";

// ─── Secret patterns ──────────────────────────────────────────────────────
// High-confidence patterns. Each line is a real attacker-recognizable shape;
// we deliberately avoid loose patterns like /password/i to keep false-positive
// rates low. Tested against the canonical formats from each vendor's docs.
export const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "aws_access_key_id",  pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "aws_secret_access_key", pattern: /\b[A-Za-z0-9/+=]{40}\b(?=.*aws|.*AWS)/ },
  { name: "github_token",        pattern: /\bgh[ps]_[A-Za-z0-9]{36,251}\b/ },
  { name: "github_oauth",        pattern: /\bgho_[A-Za-z0-9]{36}\b/ },
  { name: "github_pat_classic",  pattern: /\bghp_[A-Za-z0-9]{36}\b/ },
  { name: "openai_api_key",      pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/ },
  { name: "anthropic_api_key",   pattern: /\bsk-ant-[A-Za-z0-9-]{32,}\b/ },
  { name: "stripe_live_key",     pattern: /\bsk_live_[A-Za-z0-9]{24,}\b/ },
  { name: "stripe_test_key",     pattern: /\bsk_test_[A-Za-z0-9]{24,}\b/ },
  { name: "stripe_publishable",  pattern: /\bpk_live_[A-Za-z0-9]{24,}\b/ },
  { name: "slack_bot_token",     pattern: /\bxox[bpoa]-[A-Za-z0-9-]{10,}\b/ },
  { name: "slack_webhook",       pattern: /\bhttps:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{24}\b/ },
  { name: "google_api_key",      pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "twilio_account_sid",  pattern: /\bAC[a-f0-9]{32}\b/ },
  { name: "sendgrid_api_key",    pattern: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/ },
  { name: "mailgun_api_key",     pattern: /\bkey-[a-f0-9]{32}\b/ },
  { name: "jwt",                 pattern: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ },
  { name: "ssh_private_key",     pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/ },
  { name: "rsa_private_key",     pattern: /-----BEGIN PRIVATE KEY-----/ },
  { name: "pgp_private_key",     pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/ }
];

// File names that should never be in a published skill folder. Match by
// basename (not full path), case-insensitive.
const FORBIDDEN_FILE_PATTERNS: RegExp[] = [
  /^\.env(\..*)?$/i,            // .env, .env.local, .env.production
  /^secrets?\.json$/i,
  /^credentials\.json$/i,
  /^\.npmrc$/i,                 // can contain auth tokens
  /^\.netrc$/i,
  /^\.pypirc$/i,
  /^\.pgpass$/i,
  /^id_rsa(\.pub)?$/i,
  /^id_ed25519(\.pub)?$/i,
  /^id_ecdsa(\.pub)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.keystore$/i,
  /^auth(_token)?$/i
];

// Directories that should never appear inside a skill folder.
const FORBIDDEN_DIRS = new Set([
  "node_modules", "dist", "build", "out", ".next", ".nuxt",
  "__pycache__", ".venv", "venv", "env",
  "target",                      // rust
  ".gradle", ".idea", ".vscode",
  "vendor",                      // composer/php
  ".terraform"
]);

// Binary executable magic bytes — refuse if we see these.
const BINARY_EXEC_MAGIC: Uint8Array[] = [
  new Uint8Array([0x7F, 0x45, 0x4C, 0x46]),       // ELF (Linux)
  new Uint8Array([0xCF, 0xFA, 0xED, 0xFE]),       // Mach-O 64-bit LE
  new Uint8Array([0xCE, 0xFA, 0xED, 0xFE]),       // Mach-O 32-bit LE
  new Uint8Array([0xFE, 0xED, 0xFA, 0xCF]),       // Mach-O 64-bit BE
  new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE]),       // Mach-O fat
  new Uint8Array([0x4D, 0x5A])                    // PE (Windows)
];

// Allowed binary file extensions (for assets that ARE OK to include).
const ALLOWED_BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".pdf",
  ".woff", ".woff2", ".ttf", ".otf"
]);

const MAX_FILE_BYTES   = 1 * 1024 * 1024;   // 1 MB per file
const MAX_FOLDER_BYTES = 5 * 1024 * 1024;   // 5 MB total
const MAX_FILE_COUNT   = 50;                // warn threshold

// ─── Public API ───────────────────────────────────────────────────────────

export interface SafetyIssue {
  severity: "reject" | "warn";
  code: string;
  file?: string;
  line?: number;
  message: string;
}

export interface SubmitFolderInspection {
  ok: boolean;                          // false if any reject-severity issues
  issues: SafetyIssue[];
  files: Array<{ path: string; bytes: number }>;  // accepted file manifest
  total_bytes: number;
  has_skill_md: boolean;
}

/**
 * Walks a skill folder and runs every guardrail. Caller decides what to do
 * with `issues`. Pure inspection — no network, no mutations.
 */
export function inspectSubmitFolder(rootPath: string): SubmitFolderInspection {
  const issues: SafetyIssue[] = [];
  const files: Array<{ path: string; bytes: number }> = [];
  let total = 0;
  let hasSkillMd = false;

  function walk(dir: string): void {
    let entries: string[];
    try { entries = readdirSync(dir); } catch (err) {
      issues.push({ severity: "reject", code: "unreadable_dir", file: dir, message: `cannot read directory: ${(err as Error).message}` });
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      const rel = relative(rootPath, full);

      if (st.isDirectory()) {
        if (FORBIDDEN_DIRS.has(name)) {
          issues.push({ severity: "reject", code: "forbidden_dir", file: rel, message: `'${name}' directories are not allowed in published skills` });
          continue; // do not descend
        }
        if (name.startsWith(".") && name !== ".claude") continue; // skip hidden dirs except .claude
        walk(full);
        continue;
      }
      if (!st.isFile()) continue;

      // Filename check
      if (FORBIDDEN_FILE_PATTERNS.some((p) => p.test(name))) {
        issues.push({ severity: "reject", code: "forbidden_filename", file: rel, message: `file name matches a known secret/credential pattern (${name})` });
        continue;
      }

      // Size check
      if (st.size > MAX_FILE_BYTES) {
        issues.push({ severity: "reject", code: "file_too_large", file: rel, message: `file is ${formatBytes(st.size)}, max is ${formatBytes(MAX_FILE_BYTES)}` });
        continue;
      }

      // Track SKILL.md at root
      if (rel === "SKILL.md") hasSkillMd = true;

      // Read + scan
      let buf: Buffer;
      try { buf = readFileSync(full); } catch (err) {
        issues.push({ severity: "warn", code: "unreadable_file", file: rel, message: (err as Error).message });
        continue;
      }

      // Binary executable check
      const isExec = BINARY_EXEC_MAGIC.some((magic) =>
        buf.length >= magic.length && magic.every((b, i) => buf[i] === b)
      );
      if (isExec) {
        issues.push({ severity: "reject", code: "binary_executable", file: rel, message: "binary executable detected (ELF / Mach-O / PE)" });
        continue;
      }

      // Detect text vs binary heuristically
      const looksText = buf.length === 0 || buf.subarray(0, Math.min(buf.length, 8000)).every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127) || b >= 128);
      const ext = name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
      if (!looksText && !ALLOWED_BINARY_EXT.has(ext)) {
        issues.push({ severity: "reject", code: "unknown_binary", file: rel, message: `binary file with unrecognized extension '${ext}' — only images/fonts/PDFs are allowed` });
        continue;
      }

      // Secret regex scan on text content
      if (looksText) {
        const text = buf.toString("utf8");
        const hits = scanForSecrets(text);
        if (hits.length > 0) {
          for (const hit of hits) {
            issues.push({
              severity: "reject",
              code: `secret:${hit.name}`,
              file: rel,
              line: hit.line,
              message: `looks like a ${hit.name.replace(/_/g, " ")} on line ${hit.line}`
            });
          }
          continue;
        }
      }

      files.push({ path: rel, bytes: st.size });
      total += st.size;
    }
  }

  walk(rootPath);

  if (!hasSkillMd) {
    issues.push({ severity: "reject", code: "missing_skill_md", message: "no SKILL.md at folder root — required for a publishable skill" });
  }
  if (total > MAX_FOLDER_BYTES) {
    issues.push({ severity: "reject", code: "folder_too_large", message: `total folder size ${formatBytes(total)} exceeds ${formatBytes(MAX_FOLDER_BYTES)}` });
  }
  if (files.length > MAX_FILE_COUNT) {
    issues.push({ severity: "warn", code: "many_files", message: `${files.length} files in folder — most skills are <50` });
  }

  return {
    ok: !issues.some((i) => i.severity === "reject"),
    issues,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    total_bytes: total,
    has_skill_md: hasSkillMd
  };
}

/**
 * Scan a string for any secret pattern. Returns each match with the line
 * number so we can show the user where to fix.
 */
export function scanForSecrets(text: string): Array<{ name: string; line: number; snippet: string }> {
  const results: Array<{ name: string; line: number; snippet: string }> = [];
  const lines = text.split(/\r?\n/);
  for (const { name, pattern } of SECRET_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      while ((m = re.exec(line)) !== null) {
        results.push({ name, line: i + 1, snippet: m[0].slice(0, 32) });
        if (!pattern.flags.includes("g")) break;
      }
    }
  }
  return results;
}

// ─── Report payload sanitizer ─────────────────────────────────────────────

export interface ReportPayload {
  skill_version_id?: string;
  agent?: string;
  task_type?: string;
  outcome?: string;
  failure_codes?: string[];
  workaround_codes?: string[];
  environment?: unknown;  // strip if present
  [k: string]: unknown;
}

export interface SanitizedReport {
  ok: boolean;
  issues: SafetyIssue[];
  payload: ReportPayload;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]+$/;
const CODE_RE = /^[a-z0-9_:-]+$/;

export function sanitizeReportPayload(input: ReportPayload): SanitizedReport {
  const issues: SafetyIssue[] = [];
  const out: ReportPayload = {};

  // skill_version_id — must be UUID
  if (!input.skill_version_id || !UUID_RE.test(input.skill_version_id)) {
    issues.push({ severity: "reject", code: "invalid_skill_version_id", message: "skill_version_id must be a UUID" });
  } else out.skill_version_id = input.skill_version_id;

  // agent — slug-safe, max 40
  const agent = (input.agent ?? "").toString().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
  if (agent.length === 0) issues.push({ severity: "reject", code: "missing_agent", message: "agent is required" });
  else out.agent = agent;

  // task_type — strict slug, max 40
  const task = (input.task_type ?? "").toString().toLowerCase();
  if (!task || task.length > 40 || !SLUG_RE.test(task)) {
    issues.push({ severity: "reject", code: "invalid_task_type", message: "task_type must be a slug like 'webapp-testing' (lowercase letters, digits, hyphens, max 40 chars)" });
  } else out.task_type = task;

  // outcome — enum
  if (!["success", "failure", "partial"].includes(input.outcome ?? "")) {
    issues.push({ severity: "reject", code: "invalid_outcome", message: "outcome must be success | failure | partial" });
  } else out.outcome = input.outcome;

  // failure_codes / workaround_codes — strict slug, max 80, max 10 items
  out.failure_codes = sanitizeCodeArray(input.failure_codes, "failure_codes", issues);
  out.workaround_codes = sanitizeCodeArray(input.workaround_codes, "workaround_codes", issues);

  // environment — strip silently (unused server-side)
  // (intentionally not copied to `out`)

  // Final backstop: serialize and regex-scan for any secret pattern
  const serialized = JSON.stringify(out);
  const hits = scanForSecrets(serialized);
  if (hits.length > 0) {
    for (const hit of hits) {
      issues.push({
        severity: "reject",
        code: `payload_secret:${hit.name}`,
        message: `report payload contains what looks like a ${hit.name.replace(/_/g, " ")} — refusing to send`
      });
    }
  }

  return {
    ok: !issues.some((i) => i.severity === "reject"),
    issues,
    payload: out
  };
}

function sanitizeCodeArray(arr: unknown, fieldName: string, issues: SafetyIssue[]): string[] {
  if (!arr) return [];
  if (!Array.isArray(arr)) {
    issues.push({ severity: "reject", code: `invalid_${fieldName}`, message: `${fieldName} must be an array of slugs` });
    return [];
  }
  const cleaned: string[] = [];
  for (const raw of arr) {
    const c = (raw ?? "").toString().toLowerCase();
    if (!c) continue;
    if (c.length > 80 || !CODE_RE.test(c)) {
      issues.push({ severity: "warn", code: `${fieldName}_skipped`, message: `dropped invalid code '${c.slice(0, 40)}' (must match /^[a-z0-9_:-]{1,80}$/)` });
      continue;
    }
    cleaned.push(c);
    if (cleaned.length >= 10) break;
  }
  return cleaned;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

export function formatInspectionSummary(inspection: SubmitFolderInspection): string {
  const rejects = inspection.issues.filter((i) => i.severity === "reject");
  const warns = inspection.issues.filter((i) => i.severity === "warn");
  const lines: string[] = [];
  lines.push(`folder check: ${inspection.files.length} file(s) · ${formatBytes(inspection.total_bytes)} · SKILL.md ${inspection.has_skill_md ? "✓" : "✗"}`);
  if (rejects.length) {
    lines.push("");
    lines.push("REJECTS (upload aborted):");
    for (const r of rejects) lines.push(`  ✗ ${r.file ? r.file + ": " : ""}${r.message}${r.line ? ` (line ${r.line})` : ""}`);
  }
  if (warns.length) {
    lines.push("");
    lines.push("warnings:");
    for (const w of warns) lines.push(`  ⚠ ${w.file ? w.file + ": " : ""}${w.message}`);
  }
  if (inspection.ok) {
    lines.push("");
    lines.push("manifest (will be uploaded):");
    for (const f of inspection.files.slice(0, 30)) lines.push(`  + ${f.path}  (${formatBytes(f.bytes)})`);
    if (inspection.files.length > 30) lines.push(`  ... and ${inspection.files.length - 30} more`);
  }
  return lines.join("\n");
}
