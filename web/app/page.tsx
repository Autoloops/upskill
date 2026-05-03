import { Suspense } from "react";
import Link from "next/link";
import { findSkills, getTopSkills, getStats } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { SkillCard } from "@/components/SkillCard";
import { TrustBadge } from "@/components/TrustBadge";
import { formatNumber, repoFromLocator } from "@/lib/utils";

export const dynamic = "force-dynamic";
// Surface the home page from a 60s-stale ISR cache so most visitors get a
// pre-rendered HTML response instead of hitting the registry API.
export const revalidate = 60;

interface PageProps {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = (searchParams.q ?? "").trim();

  return (
    <div className="container-tight pt-12 pb-16">
      {/* Hero */}
      <section className="max-w-3xl mb-10">
        <div className="flex items-center gap-2 mb-5 text-2xs font-mono uppercase tracking-micro text-fog-400">
          <span className="text-accent">●</span>
          <span>10,000+ skills indexed</span>
          <span className="text-fog-500">·</span>
          <span>updated continuously</span>
        </div>
        <h1 className="text-[40px] md:text-[52px] font-bold tracking-ultra leading-[1.05] text-fog-100 mb-4">
          The registry your AI<br />
          <span className="text-accent">reaches for</span> before it codes.
        </h1>
        <p className="text-fog-300 text-base leading-relaxed max-w-2xl mb-8">
          Mixture of experts at the agent layer. <span className="text-fog-200">10,000+ vetted skills</span> from
          Anthropic, OpenAI, Stripe, Vercel, Microsoft, Cloudflare, Google Workspace, Notion,
          Garry Tan, obra/superpowers and a hundred solo authors. One CLI, one specialist per task.
        </p>
      </section>

      <div className="mb-8">
        <SearchBar initialQuery={query} />
      </div>

      <Suspense fallback={<ResultsSkeleton />}>
        {query ? <SearchResults query={query} /> : <FeaturedTopSkills />}
      </Suspense>

      {!query && (
        <Suspense fallback={null}>
          <StatsRow />
        </Suspense>
      )}
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  let results: Awaited<ReturnType<typeof findSkills>>["results"] = [];
  let error: string | null = null;
  try {
    const r = await findSkills({ query, limit: 30 });
    results = r.results;
  } catch (e) {
    error = (e as Error).message;
  }

  if (error) {
    return (
      <div className="panel px-5 py-4 text-bad text-sm">
        Registry call failed. <span className="font-mono text-2xs text-fog-400">{error}</span>
      </div>
    );
  }
  if (!results.length) {
    return (
      <div className="panel px-5 py-6 text-center text-fog-400">
        <p className="text-fog-300">No skills matched <span className="font-mono text-fog-200">"{query}"</span>.</p>
        <p className="text-2xs mt-2">Try a fuller sentence — the matcher gets sharper with more context.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="text-fog-200 text-sm font-mono">
          <span className="text-fog-500">{">"}</span> upskill find <span className="text-purple">"{query}"</span>
        </h2>
        <span className="text-2xs text-fog-500 font-mono">{results.length} results</span>
      </div>
      {results.map((s, i) => (
        <SkillCard key={s.skill_id} skill={s} rank={i + 1} />
      ))}
    </div>
  );
}

/**
 * Replaces the previous "routing examples" rail (which hit /find × 4 per
 * visit). Now we pull from the cached /top/skills endpoint — single call,
 * 60s server-side cached, no OpenAI embed required.
 */
async function FeaturedTopSkills() {
  let top: Awaited<ReturnType<typeof getTopSkills>>["results"] = [];
  try {
    const r = await getTopSkills({ sort: "composite", limit: 12 });
    top = r.results;
  } catch {
    return (
      <div className="panel px-5 py-4 text-fog-400 text-sm">
        Couldn't load the leaderboard. Try the search bar above.
      </div>
    );
  }
  if (!top.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-fog-200 text-sm font-medium">
          Most reached-for skills
          <span className="ml-2 text-2xs font-mono text-fog-500">// what your agent searches when it doesn't know what to use</span>
        </h2>
        <Link
          href="/leaderboard"
          className="text-2xs font-mono text-accent hover:underline"
        >
          full leaderboard →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {top.map((skill, i) => {
          const { owner, repo } = repoFromLocator(skill.skill_id);
          return (
            <Link
              key={skill.skill_id}
              href={`/skills/${encodeURIComponent(skill.skill_id)}`}
              className="panel panel-hover px-5 py-4 group block animate-fade-up"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-2xs text-fog-500 tabular-nums w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-fog-100 font-medium tracking-tight truncate group-hover:text-accent transition-colors">
                    {skill.name}
                  </span>
                  <TrustBadge level={skill.trust_level} />
                </div>
                <span className="text-fog-500 group-hover:text-accent transition-colors text-sm shrink-0">→</span>
              </div>
              <p className="text-fog-300 text-sm leading-relaxed line-clamp-2 mb-2">
                {skill.description}
              </p>
              <div className="flex items-center gap-3 text-2xs font-mono text-fog-400 tabular-nums">
                <span className="text-fog-500">{owner}/{repo}</span>
                {skill.github_stars != null && skill.github_stars > 0 && (
                  <span><span className="text-fog-500">★</span> {formatNumber(skill.github_stars)}</span>
                )}
                {skill.external_installs != null && skill.external_installs > 0 && (
                  <span><span className="text-fog-500">⇣</span> {formatNumber(skill.external_installs)}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="pt-2">
        <p className="text-2xs font-mono text-fog-500 text-center">
          search the full registry above · or hit <Link href="/repos" className="text-accent hover:underline">top repos</Link> · <Link href="/stats" className="text-accent hover:underline">stats</Link>
        </p>
      </div>
    </div>
  );
}

async function StatsRow() {
  let s: Awaited<ReturnType<typeof getStats>> | null = null;
  try { s = await getStats(); } catch { return null; }
  if (!s) return null;
  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3">
      <Stat label="Published" value={formatNumber(s.published)} accent />
      <Stat label="Verified vendor" value={formatNumber(s.by_trust_level?.verified ?? 0)} />
      <Stat label="Reviewed curated" value={formatNumber(s.by_trust_level?.reviewed ?? 0)} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-2xs uppercase tracking-micro text-fog-500 font-mono">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${accent ? "text-accent" : "text-fog-100"}`}>
        {value}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="panel px-5 py-4 animate-pulse">
          <div className="h-4 w-1/3 bg-ink-line rounded mb-2" />
          <div className="h-3 w-2/3 bg-ink-line rounded" />
        </div>
      ))}
    </div>
  );
}
