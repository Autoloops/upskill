# upskill-web

Public-facing browser for the upskill skill registry. Lives at
**[upskill.autoloops.ai](https://upskill.autoloops.ai)**.

Built with Next.js 14 (App Router), Tailwind, Geist fonts. Hits the registry
HTTP API at `mcp.autoloops.ai` directly from the browser. No server-side
state, no auth, no database — every page is a thin presentation layer over
the public JSON API.

## Pages

| route | what it shows | data source |
|---|---|---|
| `/` | Hero, search bar, top-12 reached-for skills | `GET /api/v1/top/skills?sort=composite&limit=12` |
| `/?q=…` | Search results for a query | `POST /api/v1/find` |
| `/skills/[id]` | Full SKILL.md, sidebar with metrics + feedback + env vars + commands | `POST /api/v1/inspect` |
| `/leaderboard` | Top 100 skills sortable by composite/stars/installs/feedback | `GET /api/v1/top/skills` |
| `/repos` | Top 200 publishers grouped by repo, filterable by trust tier | `GET /api/v1/top/repos` |
| `/stats` | Live registry stats — published count, trust breakdown, category histogram | `GET /api/v1/stats` |

## API — what `mcp.autoloops.ai` exposes

All endpoints return JSON. CORS allows `https://upskill.autoloops.ai` and
`http://localhost:3000`. Read endpoints (GET) are 15-min cached server-side
and return an `X-Cache: hit|miss` header for observability.

### `POST /api/v1/find`

Hybrid search across the registry. Returns up to `limit` skills ranked by a
composite of FTS keyword match + 1024-dim cosine similarity + name-match
boost + popularity tiebreaker.

Two parallel candidate tracks (FTS via GIN index, vector via HNSW index)
return the top-K eligible rows per the trust filter; results are merged in
the app and re-ranked.

**Input**

```json
{
  "query": "stripe checkout end-to-end with webhook signature verification",
  "limit": 30,
  "filters": {
    "trust_level_min": "verified | reviewed | community"
  }
}
```

If `filters.trust_level_min` is omitted the server defaults to **verified**.
This protects pre-0.9 CLI clients that don't send a trust filter.

**Output** — `{ "results": [SkillSummary, …] }`. Each result has:
`skill_id`, `name`, `description`, `trust_level`, `score`, `match_reason
{text_score, vector_sim, name_match, path_match, popularity_boost}`,
`github_stars`, `external_installs`, `distribution {repo_url, ref, path}`,
`missing_dependencies`, `warnings`, `primary_task`.

### `POST /api/v1/inspect`

Full detail view of a single skill including the SKILL.md body, dependencies,
env vars, feedback aggregations, and source GitHub commit.

**Input** — `{ "skill_id": "github:owner/repo/path" }` or `{ "skill_version_id": "<uuid>" }`.

**Output** — `SkillDetail` (everything `find` returns plus `skill_md`, full
`auth`/`permissions`/`capabilities`/`commands`/`env_vars`/`external_services`
arrays, and `feedback_stats` with the outcome histogram).

### `GET /api/v1/stats`

Registry-wide aggregates.

**Output** — `{ total_skills, published, blocked, last_indexed_at,
by_trust_level: { verified, reviewed, community }, by_category: { … } }`.

### `GET /api/v1/top/skills?sort=composite|stars|installs|feedback&limit=100`

Leaderboard. `composite` is `log10(stars+1)*0.4 + log10(installs+1)*0.4 +
log10(success-failure+1)*0.2 + trust_bonus`.

**Output** — `{ results: [{ skill_id, name, description, trust_level,
github_stars, external_installs, feedback_successes, feedback_failures,
composite_score }, …] }`.

### `GET /api/v1/top/repos?limit=50&trust=verified|reviewed|community`

Top publishers grouped by `(owner, repo)`, sorted by skill count. Pass
`trust` to filter to a single tier.

**Output** — `{ results: [{ owner, repo, repo_url, skill_count,
total_stars, trust_level, sample_skills: [{ skill_id, name }, …] }, …] }`.

### `POST /api/v1/report` — *CLI-only, not consumed by the website*

Outcome telemetry endpoint. The CLI runs every payload through a strict
sanitizer (UUID + slug + enum validation, regex pass for known secret
formats) before sending; see [`cli/src/safety.ts`](../cli/src/safety.ts).

### `POST /api/v1/submit` — *CLI-only, not consumed by the website*

Skill submission queue. The CLI runs the entire folder through a safety
inspection (no `.env`/SSH keys/`*.pem`, no `node_modules`, no binary execs,
secret-pattern regex on every text file, 5 MB folder cap, 1 MB per file)
before any byte goes over the wire.

## Develop locally

```bash
cd web && npm install && npm run dev
# http://localhost:3000 talks to https://mcp.autoloops.ai by default
```

To point at a self-hosted registry:

```bash
NEXT_PUBLIC_UPSKILL_URL=http://localhost:8787 npm run dev
```

## Deploy

- **Hosting:** Vercel. Project root `web`, framework auto-detected as
  Next.js, Node 20.
- **Env var:** `NEXT_PUBLIC_UPSKILL_URL=https://mcp.autoloops.ai` on
  Production.
- **Domain:** `upskill.autoloops.ai` — A record `76.76.21.21` on the parent
  zone. Vercel auto-issues a Let's Encrypt cert once DNS resolves.
- **Cache:** Next.js ISR with `revalidate = 60`. Each page caches for 60s;
  the underlying API caches for 15 min on the server side. Real cold paths
  are rare.

## License

MIT.
