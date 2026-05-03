import Link from "next/link";
import { getTopRepos, type TopRepo, type TrustLevel } from "@/lib/api";
import { TrustBadge } from "@/components/TrustBadge";
import { formatNumber } from "@/lib/utils";
import { GithubIcon, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const TABS: Array<{ key: TrustLevel | "all"; label: string; help: string }> = [
  { key: "all",       label: "All",       help: "everything indexed" },
  { key: "verified",  label: "Verified",  help: "vendor-official only" },
  { key: "reviewed",  label: "Reviewed",  help: "curated practitioners + influencers" },
  { key: "community", label: "Community", help: "everyone else" }
];

interface PageProps { searchParams: { trust?: string } }

export default async function ReposPage({ searchParams }: PageProps) {
  const trustParam = searchParams.trust && ["verified", "reviewed", "community"].includes(searchParams.trust)
    ? (searchParams.trust as TrustLevel)
    : undefined;
  const activeTab: TrustLevel | "all" = trustParam ?? "all";

  let results: TopRepo[] = [];
  let error: string | null = null;
  try {
    const r = await getTopRepos({ limit: 200, trust: trustParam });
    results = r.results;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="container-tight py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-fog-100 mb-2">Top repos</h1>
        <p className="text-fog-300 text-sm max-w-3xl">
          Where the skills come from. Sorted by skill count. Three trust tiers:
          <span className="text-accent"> verified</span> repos are vendor-official,
          <span className="text-purple"> reviewed</span> are curated by recognized practitioners, and
          <span className="text-fog-200"> community</span> is everything else.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 panel inline-flex p-1 text-2xs font-mono uppercase tracking-micro">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/repos" : `/repos?trust=${tab.key}`}
            title={tab.help}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === tab.key
                ? tab.key === "verified"  ? "bg-accent text-ink"
                : tab.key === "reviewed"  ? "bg-purple text-ink"
                : tab.key === "community" ? "bg-fog-300 text-ink"
                : "bg-fog-200 text-ink"
                : "text-fog-300 hover:text-fog-100 hover:bg-ink-panel"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <span className="text-fog-500 text-2xs ml-3 font-mono normal-case tracking-normal">
          {error ? "—" : `${results.length} repos`}
        </span>
      </div>

      {error && (
        <div className="panel px-5 py-4 text-bad text-sm">
          The /api/v1/top/repos endpoint failed. <span className="font-mono text-2xs text-fog-400">{error}</span>
        </div>
      )}

      {!error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((r) => (
            <div key={`${r.owner}/${r.repo}`} className="panel panel-hover px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GithubIcon size={14} className="text-fog-400 shrink-0" />
                    <a
                      href={r.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[13px] truncate hover:text-accent transition-colors group inline-flex items-center gap-1"
                    >
                      <span className="text-fog-300">{r.owner}/</span>
                      <span className="text-fog-100">{r.repo}</span>
                      <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-fog-400 transition-opacity" />
                    </a>
                    <TrustBadge level={r.trust_level} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-2xs font-mono text-fog-400 tabular-nums">
                    <span><span className="text-fog-200 font-semibold">{r.skill_count}</span> skills</span>
                    {r.total_stars != null && r.total_stars > 0 && (
                      <span><span className="text-fog-500">★</span> {formatNumber(r.total_stars)}</span>
                    )}
                  </div>
                </div>
              </div>
              {r.sample_skills?.length > 0 && (
                <div className="border-t border-ink-line pt-3 space-y-1">
                  {r.sample_skills.slice(0, 3).map((s) => (
                    <Link
                      key={s.skill_id}
                      href={`/skills/${encodeURIComponent(s.skill_id)}`}
                      className="block font-mono text-2xs text-fog-400 hover:text-fog-200 truncate transition-colors"
                    >
                      ↳ {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Methodology explainer */}
      <section className="mt-12 panel px-6 py-5 max-w-3xl">
        <h2 className="text-fog-100 font-semibold mb-3 text-base">How trust tiers work</h2>
        <div className="space-y-3 text-fog-300 text-sm leading-relaxed">
          <div>
            <span className="pill pill-accent mr-2">verified</span>
            <span className="text-fog-200 font-medium">Vendor-official.</span> The repo is owned by the company or organization that makes the product the skill is about. Examples: <span className="font-mono text-2xs text-fog-200">anthropics/skills</span>, <span className="font-mono text-2xs text-fog-200">openai/skills</span>, <span className="font-mono text-2xs text-fog-200">stripe/skills</span>, <span className="font-mono text-2xs text-fog-200">cloudflare/skills</span>, <span className="font-mono text-2xs text-fog-200">microsoft/azure-skills</span>, <span className="font-mono text-2xs text-fog-200">getsentry/skills</span>, <span className="font-mono text-2xs text-fog-200">datadog-labs/pup</span>.
          </div>
          <div>
            <span className="pill pill-purple mr-2">reviewed</span>
            <span className="text-fog-200 font-medium">Curated by recognized practitioners or notable communities.</span> Solo authors with deep expertise, niche labs, or well-known influencers in the AI / dev / product space. Not vendor-official, but reliable. Examples: <span className="font-mono text-2xs text-fog-200">obra/superpowers</span>, <span className="font-mono text-2xs text-fog-200">garrytan/gstack</span>, <span className="font-mono text-2xs text-fog-200">mattpocock/skills</span>, <span className="font-mono text-2xs text-fog-200">K-Dense-AI/scientific-agent-skills</span>.
          </div>
          <div>
            <span className="pill pill-fog mr-2">community</span>
            <span className="text-fog-200 font-medium">Everyone else.</span> Open submissions, niche side projects, experimental skill packs. Quality varies — feedback signals from agents using them help rank them up or down. Most of the registry lives here.
          </div>
          <div className="pt-2 mt-3 border-t border-ink-line text-2xs text-fog-400">
            Methodology: assignments are made at index time. Curated list lives in <a href="https://github.com/Autoloops/upskill" className="text-accent hover:underline">github.com/Autoloops/upskill</a>. To request a tier change for your repo, open an issue. Coming soon: a CLI install option to default search to <span className="font-mono text-fog-200">verified + reviewed</span> only, with community as opt-in.
          </div>
        </div>
      </section>
    </div>
  );
}
