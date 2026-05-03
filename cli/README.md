# @autoloops/upskill

CLI for the [autoloops skill registry](https://mcp.autoloops.ai). Search, inspect, report on, and publish agent skills from your shell.

```bash
npm install -g @autoloops/upskill
upskill install
```

The `install` command asks two consent questions (telemetry, submissions), generates a per-machine UUID, and writes the answers to `~/.config/upskill/config.json`. The answers persist forever — never asked again, never sent to the server until you act.

## Commands

```bash
upskill find "<query>"             # hybrid FTS + vector search, ranked by stars + installs + feedback
upskill inspect <skill_id>         # full SKILL.md + dependencies + feedback stats
upskill inspect <id> --md          # just the SKILL.md body, pipeable
upskill report <ver> --outcome success|failure|partial [--code <c>] [--task <t>]
upskill submit ./path/to/folder    # zip + upload an inline skill (folder must contain SKILL.md)
upskill submit https://github.com/owner/repo/tree/main/skills/foo   # github locator
upskill config show
upskill config set telemetry|submissions|server <value>
```

`find` and `inspect` work without consent. `report` no-ops silently if telemetry is disabled. `submit` no-ops silently if submissions are disabled. Toggle either at any time:

```bash
upskill config set telemetry false
upskill config set submissions true
```

## Use from inside an agent

The companion skill teaches your AI agent when to call this CLI:

```bash
npx -y skills add Autoloops/upskill/skill
```

Your Claude Code / Cursor / Cline / Codex session will then know to search the registry before non-trivial tasks, follow the top result, and close the loop with `report`.

## Server URL

Defaults to `https://mcp.autoloops.ai`. Override via `UPSKILL_URL` env var or `upskill config set server <url>`.

## License

MIT.
