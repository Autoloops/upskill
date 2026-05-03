import Link from "next/link";
import { getTopSkills, type TopSkill } from "@/lib/api";
import { TrustBadge } from "@/components/TrustBadge";
import { formatNumber, repoFromLocator } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const SORTS: Array<{ key: "composite" | "stars" | "installs" | "feedback"; label: string; help: string }> = [
  { key: "composite", label: "Composite", help: "stars × installs × feedback" },
  { key: "stars", label: "Stars", help: "most-starred parent repo" },
  { key: "installs", label: "Installs", help: "skills.sh install count" },
  { key: "feedback", label: "Feedback", help: "agent-reported success rate" }
];

interface PageProps { searchParams: { sort?: string } }

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const sort = (SORTS.find((s) => s.key === searchParams.sort) ?? SORTS[0]).key;
  let results: TopSkill[] = [];
  let error: string | null = null;
  try {
    const r = await getTopSkills({ sort, limit: 100 });
    results = r.results;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="container-tight py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-fog-100 mb-2">Top skills</h1>
        <p className="text-fog-300 text-sm">The skills your agent should reach for first. Ranked across the registry.</p>
      </div>

      <div className="flex items-center gap-1 mb-5 panel inline-flex p-1 text-2xs font-mono uppercase tracking-micro">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={s.key === "composite" ? "/leaderboard" : `/leaderboard?sort=${s.key}`}
            title={s.help}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              sort === s.key ? "bg-accent text-ink" : "text-fog-300 hover:text-fog-100 hover:bg-ink-panel"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="panel px-5 py-4 text-bad text-sm">
          The /api/v1/top/skills endpoint isn't live yet. <span className="font-mono text-2xs text-fog-400">{error}</span>
        </div>
      )}

      {!error && results.length > 0 && (
        <div className="panel divide-y divide-ink-line overflow-hidden">
          {results.map((s, i) => {
            const { owner, repo } = repoFromLocator(s.skill_id);
            const fbTotal = s.feedback_successes + s.feedback_failures;
            const rate = fbTotal > 0 ? Math.round((s.feedback_successes / fbTotal) * 100) : null;
            return (
              <Link
                key={s.skill_id}
                href={`/skills/${encodeURIComponent(s.skill_id)}`}
                className="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[2.5rem_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-ink-panel/60 transition-colors"
              >
                <span className="font-mono text-2xs text-fog-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-fog-100 font-medium truncate">{s.name}</span>
                    <TrustBadge level={s.trust_level} className="shrink-0" />
                  </div>
                  <div className="font-mono text-2xs text-fog-400 truncate">{owner}/{repo}</div>
                </div>
                <div className="hidden md:flex items-center gap-1 text-2xs font-mono text-fog-300 tabular-nums w-16 justify-end" title="github stars">
                  <span className="text-fog-500">★</span>
                  {formatNumber(s.github_stars)}
                </div>
                <div className="hidden md:flex items-center gap-1 text-2xs font-mono text-fog-300 tabular-nums w-16 justify-end" title="installs">
                  <span className="text-fog-500">⇣</span>
                  {formatNumber(s.external_installs)}
                </div>
                <div className="hidden md:flex items-center gap-1 text-2xs font-mono tabular-nums w-20 justify-end" title="feedback">
                  {rate != null ? (
                    <span className={rate >= 80 ? "text-accent" : rate >= 50 ? "text-warn" : "text-bad"}>{rate}%</span>
                  ) : (
                    <span className="text-fog-500">—</span>
                  )}
                </div>
                <div className="font-mono text-2xs text-fog-400 tabular-nums shrink-0">
                  {s.composite_score?.toFixed(2) ?? "—"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
