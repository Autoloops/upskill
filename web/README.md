# upskill-web

Public-facing browser for the [upskill](https://github.com/Autoloops/upskill) skill registry. Lives at **[upskill.autoloops.ai](https://upskill.autoloops.ai)**.

Built with Next.js 14 (App Router), Tailwind, and Geist fonts. Hits the registry API at `mcp.autoloops.ai` directly from the browser. No server-side state.

## Develop locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

By default it talks to the production registry at `https://mcp.autoloops.ai`. Override with:

```bash
NEXT_PUBLIC_UPSKILL_URL=http://localhost:8787 npm run dev
```

## Deploy

Built and hosted on **Vercel**, DNS managed via **Netlify** (CNAME → Vercel domain).

### Vercel project settings

- **Root Directory:** `web` (Settings → General → Root Directory)
- **Framework preset:** Next.js (auto-detected)
- **Build command:** `npm run build` (default)
- **Output directory:** `.next` (default)
- **Install command:** `npm install` (default)
- **Node version:** 20.x (Settings → General → Node.js Version)
- **Environment variables:**
  - `NEXT_PUBLIC_UPSKILL_URL=https://mcp.autoloops.ai` (the registry API the browser calls)

Pushes to `main` auto-deploy. Preview deploys on every PR.

### DNS setup (Netlify-managed)

Add a `CNAME` record on `autoloops.ai`:

```
upskill.autoloops.ai   CNAME   cname.vercel-dns.com   3600
```

Then add `upskill.autoloops.ai` as a custom domain in Vercel project settings — it'll auto-provision SSL via Let's Encrypt within ~60 seconds. No www-redirect needed.

## Routes

- `/` — search + browse, hero, featured "routing examples"
- `/skills/[id]` — full SKILL.md with sidebar (source, metrics, feedback, env vars, commands)
- `/leaderboard` — top 100 skills, sortable by composite / stars / installs / feedback
- `/repos` — top 100 repos by skill count, with sample skills inline
- `/stats` — total skills, trust breakdown, category breakdown

## License

MIT.
