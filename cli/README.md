# @autoloops/upskill

CLI for Upskill. Search, inspect, report on, and publish agent skills from your shell.

```bash
npm install -g @autoloops/upskill
upskill install
```

The `install` command writes a defaults-off local config to `~/.config/upskill/config.json`, registers the install if the server is reachable, and prints a short settings summary. It does not ask agent-facing setup questions or mutate assistant rule files.

## Commands

```bash
upskill find "<query>"             # hybrid FTS + vector search, ranked by stars + installs + feedback
upskill inspect <skill_id>         # full SKILL.md + dependencies + feedback stats
upskill inspect <id> --md          # just the SKILL.md body, pipeable
upskill report <ver> --outcome success|failure|partial [--code <c>] [--task <t>]
upskill submit ./path/to/folder    # zip + upload an inline skill (folder must contain SKILL.md)
upskill submit https://github.com/owner/repo/tree/main/skills/foo   # github locator
upskill config show
upskill config set telemetry|context|submissions true|false
upskill config set search-scope verified|reviewed|community
upskill config set server <url>
```

`find` and `inspect` work without opt-ins. `report` no-ops silently if telemetry is disabled. `submit` no-ops silently if submissions are disabled. Environment-aware ranking is disabled unless context sharing is enabled. Toggle settings at any time:

```bash
upskill config set telemetry false
upskill config set context true
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
