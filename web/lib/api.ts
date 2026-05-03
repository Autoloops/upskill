// Typed client for the upskill registry API.
// Server URL is configurable so the page can be self-hosted against any registry.

const DEFAULT_API = "https://mcp.autoloops.ai";
export const API_BASE = process.env.NEXT_PUBLIC_UPSKILL_URL ?? DEFAULT_API;

export type TrustLevel = "verified" | "reviewed" | "community";

export interface SkillSummary {
  skill_id: string;
  skill_version_id?: string;
  name: string;
  description: string;
  trust_level: TrustLevel;
  score: number;
  match_reason: {
    text_score: number;
    vector_sim: number;
    name_match?: number;
    path_match?: number;
    popularity_boost?: number;
    dependency_penalty?: number;
  };
  github_stars?: number | null;
  github_forks?: number | null;
  external_installs?: number | null;
  external_install_source?: string | null;
  feedback_successes?: number;
  feedback_failures?: number;
  warnings?: string[];
  missing_dependencies?: Array<{ type: string; name: string }>;
  distribution?: { type: string; repo_url: string; ref: string; path: string };
  published_at?: string | null;
  primary_task?: { domain?: string; verb?: string; object?: string };
}

export interface SkillDetail extends SkillSummary {
  skill_md: string;
  source_url: string;
  source_ref: string;
  source_commit: string;
  auth: unknown[];
  permissions: unknown[];
  capabilities: string[];
  external_services: string[];
  dependencies: unknown[];
  env_vars: string[];
  commands: string[];
  feedback_stats?: {
    counts: Record<string, number>;
    common_failure_codes: Array<{ code: string; count: number }>;
    common_workaround_codes: Array<{ code: string; count: number }>;
  };
  metrics?: {
    github_stars?: number | null;
    github_forks?: number | null;
    github_watchers?: number | null;
    github_open_issues?: number | null;
    github_license?: string | null;
    external_installs?: number | null;
  };
}

export interface RegistryStats {
  total_skills: number;
  published: number;
  blocked: number;
  last_indexed_at: string | null;
  by_trust_level: Record<TrustLevel, number>;
  by_category: Record<string, number>;
}

export interface TopSkill {
  skill_id: string;
  name: string;
  description: string;
  trust_level: TrustLevel;
  github_stars: number | null;
  external_installs: number | null;
  feedback_successes: number;
  feedback_failures: number;
  composite_score: number;
}

export interface TopRepo {
  owner: string;
  repo: string;
  repo_url: string;
  skill_count: number;
  total_stars: number | null;
  trust_level: TrustLevel;
  sample_skills: Array<{ skill_id: string; name: string }>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(`POST ${path} failed: ${r.status} ${await r.text().catch(() => "")}`);
  return (await r.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
  return (await r.json()) as T;
}

export async function findSkills(opts: {
  query: string;
  limit?: number;
  filters?: { trust_level?: TrustLevel[] };
}): Promise<{ results: SkillSummary[] }> {
  return postJson("/api/v1/find", {
    query: opts.query,
    limit: opts.limit ?? 30,
    filters: opts.filters
  });
}

export async function inspectSkill(skill_id: string): Promise<SkillDetail> {
  return postJson("/api/v1/inspect", { skill_id });
}

export async function getStats(): Promise<RegistryStats> {
  return getJson("/api/v1/stats");
}

export async function getTopSkills(opts: {
  sort?: "stars" | "installs" | "feedback" | "composite";
  limit?: number;
} = {}): Promise<{ results: TopSkill[] }> {
  const sort = opts.sort ?? "composite";
  const limit = opts.limit ?? 100;
  return getJson(`/api/v1/top/skills?sort=${sort}&limit=${limit}`);
}

export async function getTopRepos(opts: { limit?: number; trust?: TrustLevel } = {}): Promise<{ results: TopRepo[] }> {
  const limit = opts.limit ?? 50;
  const trust = opts.trust ? `&trust=${opts.trust}` : "";
  return getJson(`/api/v1/top/repos?limit=${limit}${trust}`);
}
