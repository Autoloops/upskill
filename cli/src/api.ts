import type { CliConfig } from "./config.js";

export interface ApiContext {
  cfg: CliConfig;
  cliVersion: string;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(ctx: ApiContext, path: string, body: unknown, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, ctx.cfg.serverUrl).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Install-Id": ctx.cfg.installId,
    "X-Cli-Version": ctx.cliVersion,
    "User-Agent": `upskill/${ctx.cliVersion}`,
    ...(init.headers as Record<string, string> ?? {})
  };
  const res = await fetch(url, {
    method: init.method ?? "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    const message = (parsed as { error?: string } | undefined)?.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, parsed, message);
  }
  return parsed as T;
}

export interface SearchResult {
  skill_id: string;
  skill_version_id: string;
  name: string;
  description: string;
  score: number;
  match_reason: {
    text_score: number;
    vector_sim: number;
    trust: string;
    quality: number;
    github_stars: number;
    feedback_successes: number;
    feedback_failures: number;
  };
  missing_dependencies?: Array<{ type: string; name: string }>;
  missing_auth?: unknown[];
  permissions?: unknown[];
  warnings?: string[];
  trust_level?: string;
  tags?: string[];
  external_services?: string[];
  distribution?: {
    type: string;
    repo_url: string;
    ref: string;
    path: string;
    skill_md_hash: string;
  };
}

export async function find(ctx: ApiContext, input: {
  query: string;
  limit?: number;
  environment?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}): Promise<{ results: SearchResult[] }> {
  return request(ctx, "/api/v1/find", input);
}

export interface InspectResult {
  skill_id: string;
  skill_version_id: string;
  name: string;
  description: string;
  skill_md: string;
  source_url: string;
  source_commit: string | null;
  distribution: SearchResult["distribution"];
  trust_level: string;
  metrics: {
    github_stars: number | null;
    github_forks: number | null;
    github_license: string | null;
  };
  feedback_stats: Record<string, unknown>;
}

export async function inspect(ctx: ApiContext, input: { skill_id?: string; skill_version_id?: string }): Promise<InspectResult> {
  return request(ctx, "/api/v1/inspect", input);
}

export async function report(ctx: ApiContext, input: {
  skill_version_id: string;
  outcome: "success" | "failure" | "partial";
  agent: string;
  task_type: string;
  failure_codes?: string[];
  workaround_codes?: string[];
  environment?: Record<string, unknown>;
}): Promise<{ ok: true; feedback_id: string }> {
  return request(ctx, "/api/v1/report", input);
}

export async function submitGitHub(ctx: ApiContext, input: {
  github_repo: string;
  github_path?: string;
  github_ref?: string;
}): Promise<unknown> {
  return request(ctx, "/api/v1/submit", { source_type: "github", ...input });
}

export async function submitInline(ctx: ApiContext, input: {
  name: string;
  description: string;
  skill_md: string;
  files?: Array<{ path: string; content_base64: string }>;
  license?: string;
}): Promise<unknown> {
  return request(ctx, "/api/v1/submit", { source_type: "inline", ...input });
}

export async function registerInstall(ctx: ApiContext, opts: {
  telemetry_enabled: boolean;
  submissions_enabled: boolean;
  platform: string;
}): Promise<unknown> {
  return request(ctx, "/api/v1/installs/register", {
    install_id: ctx.cfg.installId,
    client_name: "upskill",
    cli_version: ctx.cliVersion,
    platform: opts.platform,
    telemetry_enabled: opts.telemetry_enabled,
    submissions_enabled: opts.submissions_enabled
  });
}
