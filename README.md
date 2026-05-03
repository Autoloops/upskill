# upskill

Two pieces, shipped together:

- [`cli/`](./cli) — `@autoloops/upskill` on npm. The shell tool your agent runs.
- [`skill/`](./skill) — the SKILL.md that teaches your agent when and how to call the CLI.

The registry server (Postgres + pgvector + 1000+ ingested skills, hosted at `mcp.autoloops.ai`) is private and lives outside this directory. This repo is what users install.

## Install

Open Claude Code (or any shell-capable agent) and paste:

```
Set up upskill on this machine. Run `npm install -g @autoloops/upskill`,
then `upskill install` and answer its two prompts (one asks if you'll send anonymous
skill outcomes back to the registry to help ranking; the other asks if you want
the `submit` command enabled for publishing skills). After that, run
`npx -y skills add Autoloops/upskill/skill` so I (the AI agent) know how to use
the CLI for future tasks. From this point on, I'll search the registry before
non-trivial tasks, report whether skills worked, and ask before publishing
anything new.
```

## Layout

```
public/                    ← becomes Autoloops/upskill on GitHub
├── cli/                   ← the npm package @autoloops/upskill
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── skill/                 ← the agent-facing SKILL.md
│   └── SKILL.md
├── README.md
├── LICENSE
└── .gitignore
```

## License

MIT.
