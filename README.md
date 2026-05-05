# Upskill

**Your AI agent is dumb by default. Upskill makes it act like an expert.**

Stop your AI from reinventing work. Give it the best proven skill before it starts.

Upskill helps AI assistants start from proven playbooks, workflows, and patterns instead of memory. Use it for serious work across code, docs, slides, email, research, spreadsheets, browser tasks, design, data, auth, cloud, CRM, support, and automation.

## Install in one paste

Paste this into Claude Code, Cursor, Codex, Cline, Windsurf, or any shell-capable AI assistant: `Install Upskill for this assistant: run npm install -g @autoloops/upskill && upskill install; ask me four setup choices before changing config: telemetry on/off, local context/env-var names on/off, submissions on/off, and search scope verified/reviewed/community; apply my answers with upskill config set; run npx -y skills add Autoloops/upskill/skill; ask before adding the persistent rule; if I say yes, append the Upskill rule to CLAUDE.md, AGENTS.md, .cursorrules, .clinerules, .windsurfrules, or ~/.claude/CLAUDE.md without overwriting anything.`

That is the setup: install the CLI, choose privacy settings, add the assistant skill, and optionally add one persistent rule so your assistant remembers to use Upskill before non-trivial work.

## Your AI keeps starting from scratch

AI agents are generalists. When they start from memory, they improvise:

- Generic pitch decks with weak narrative and stock structure.
- Shallow email triage that leaves you reading everything anyway.
- Bad spreadsheet and CSV parsing that breaks on real data.
- Broken auth flows with missing callbacks, scopes, or token handling.
- Poor UI and design that looks like every other AI-generated page.
- Weak research summaries with no synthesis or source discipline.
- Fragile browser automation that works once and then fails.
- Messy code that reinvents libraries, workflows, and patterns that already exist.

Upskill changes the starting point. Before the assistant acts, it finds the best playbook for the task and injects it into context.

## Before / After

### Data parsing

**Prompt:** `Build CSV parser`

Without Upskill, your assistant may write this:

```ts
export function parseCsv(input: string) {
  return input
    .trim()
    .split("\n")
    .map((row) => row.split(","));
}
```

That breaks on quoted commas, newlines inside cells, escaped quotes, encodings, large files, and half the CSVs people actually upload.

With Upskill, the assistant starts from the right data-parsing playbook:

```ts
import Papa from "papaparse";

export function parseCsv(input: string) {
  const result = Papa.parse(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (result.errors.length) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  return result.data;
}
```

The difference is not magic. The assistant got the right skill before it started.

### Other serious work

| Task | Without Upskill | With Upskill |
|---|---|---|
| Pitch deck | Generic template, weak story, default structure | Narrative playbook: hook, problem, solution, traction, ask |
| Inbox triage | Long list of summaries | Prioritized action queue with urgency and sender signals |
| Research | Loose summary | Cited synthesis with claims, sources, and gaps |
| Notion or spreadsheet work | Guesses the structure | Query, extract, normalize, and summarize with a clear workflow |
| Auth | Half-remembered JWT flow | Proven provider pattern with scopes, callbacks, and token handling |
| UI/design | Messy HTML or generic Tailwind | Component and layout playbook matched to the job |
| Browser tasks | Fragile click script | Tested browser workflow with selectors, waits, and screenshots |

## What Upskill does

Upskill gives your assistant a better starting point:

1. Finds the best skill for the task.
2. Lets the assistant inspect it before execution.
3. Injects the proven workflow or pattern into context.
4. Helps the assistant follow expert instructions instead of improvising.
5. Reports outcomes only if you opted in.

A skill is a proven playbook: instructions, examples, constraints, tools, and patterns that make an assistant better at a specific kind of work.

## Usage

Search for the right skill:

```bash
upskill find "triage my inbox and surface what needs a reply today"
upskill find "build a clean 12 slide seed pitch deck"
upskill find "parse uploaded CSV files with headers and quoted fields"
upskill find "research competitors and produce a cited comparison"
```

Inspect the result before using it:

```bash
upskill inspect <skill_id>
```

Then have your assistant follow the inspected skill. Once installed with the assistant skill, this is the flow it will use automatically:

```bash
upskill find "turn this customer feedback spreadsheet into the top 5 product themes"
upskill inspect <skill_id>
```

The assistant reads the skill, follows the playbook, and reports the outcome only if you enabled telemetry.

## Why it works

Models are broad. Work is specific.

A general model can write code, draft emails, summarize docs, design slides, query tools, and automate a browser. But without the right task-specific context, it guesses. Upskill supplies that context first.

Better context before execution means:

- fewer mistakes
- fewer retries
- less token waste
- more consistent output
- work that follows proven patterns instead of vibes

## Trust and control

Upskill is designed so the user stays in control:

- Nothing sensitive leaves your machine by default.
- Telemetry is off by default.
- Local context sharing is off by default.
- If enabled, local context sends env-var names only, never values.
- Submissions are off by default.
- Search defaults to verified sources.
- The persistent assistant rule is added only after user approval.
- Rules are appended, never overwritten.

You can inspect settings anytime:

```bash
upskill config show
```

And change them anytime:

```bash
upskill config set telemetry true
upskill config set context true
upskill config set submissions true
upskill config set search-scope verified
```

## Contribute skills

If you have a workflow that reliably makes an assistant better, turn it into a skill.

Good skills are not clever prompts. They are reusable work patterns:

- how to triage an inbox
- how to build a pitch deck
- how to review a pull request
- how to query a knowledge base
- how to parse messy files
- how to automate a browser workflow
- how to research with citations
- how to follow a product or design standard

The goal is simple: every agent should start important work with the best available playbook.

## License

MIT.
