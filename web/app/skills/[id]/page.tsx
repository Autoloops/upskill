import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { inspectSkill } from "@/lib/api";
import { TrustBadge } from "@/components/TrustBadge";
import { formatNumber, repoFromLocator, relativeTime } from "@/lib/utils";
import { ExternalLink, GithubIcon } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps { params: { id: string } }

export async function generateMetadata({ params }: PageProps) {
  try {
    const skill = await inspectSkill(decodeURIComponent(params.id));
    return {
      title: `${skill.name} — upskill`,
      description: skill.description.slice(0, 160),
      openGraph: { title: `${skill.name} — upskill`, description: skill.description.slice(0, 200) }
    };
  } catch {
    return { title: "Skill not found — upskill" };
  }
}

export default async function SkillDetailPage({ params }: PageProps) {
  const id = decodeURIComponent(params.id);
  let skill;
  try {
    skill = await inspectSkill(id);
  } catch {
    notFound();
  }
  if (!skill) notFound();

  const { owner, repo, path } = repoFromLocator(skill.skill_id);
  const fb = skill.feedback_stats?.counts ?? {};
  const fbSuccess = (fb.success ?? 0);
  const fbFailure = (fb.failure ?? 0);
  const fbPartial = (fb.partial ?? 0);
  const fbTotal = fbSuccess + fbFailure + fbPartial;
  const successRate = fbTotal > 0 ? Math.round((fbSuccess / fbTotal) * 100) : null;

  return (
    <div className="container-tight py-10">
      <div className="mb-6">
        <Link href="/" className="text-2xs font-mono text-fog-400 hover:text-fog-200 transition-colors">
          ← back to registry
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-fog-100">{skill.name}</h1>
          <TrustBadge level={skill.trust_level} />
        </div>
        <p className="text-fog-300 max-w-3xl text-base leading-relaxed mb-4">{skill.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-2xs font-mono text-fog-400">
          <span className="text-accent">{">_"}</span>
          <span><span className="text-fog-300">{owner}/</span><span className="text-fog-200">{repo}</span>{path && <span className="text-fog-400">/{path}</span>}</span>
          <span className="text-fog-500">·</span>
          <span>commit <span className="text-fog-200">{skill.source_commit?.slice(0, 7) ?? "?"}</span></span>
          {skill.published_at && (
            <>
              <span className="text-fog-500">·</span>
              <span>indexed {relativeTime(skill.published_at)}</span>
            </>
          )}
        </div>
      </div>

      {/* Two-column layout: SKILL.md on left, sidebar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          <div className="panel px-6 py-7">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-fog-100 prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h3:text-base prose-p:text-fog-300 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-[12px] prose-code:bg-ink-soft prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-ink-soft prose-pre:border prose-pre:border-ink-line prose-pre:rounded-lg prose-pre:text-[12.5px] prose-li:text-fog-300 prose-strong:text-fog-100 prose-blockquote:border-l-accent prose-blockquote:text-fog-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.skill_md}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <SidebarSection title="Source">
            <SidebarRow label="repo">
              <a href={skill.distribution?.repo_url ?? skill.source_url} target="_blank" rel="noreferrer" className="font-mono text-2xs text-info hover:underline inline-flex items-center gap-1">
                <GithubIcon size={12} />
                {owner}/{repo}
              </a>
            </SidebarRow>
            <SidebarRow label="commit"><span className="font-mono text-2xs text-fog-200">{skill.source_commit?.slice(0, 7) ?? "?"}</span></SidebarRow>
            <SidebarRow label="ref"><span className="font-mono text-2xs text-fog-200">{skill.source_ref ?? "main"}</span></SidebarRow>
            <SidebarRow label="open">
              <a href={skill.source_url} target="_blank" rel="noreferrer" className="text-2xs text-info hover:underline inline-flex items-center gap-1">
                view on GitHub <ExternalLink size={11} />
              </a>
            </SidebarRow>
          </SidebarSection>

          <SidebarSection title="Metrics">
            <SidebarRow label="trust"><TrustBadge level={skill.trust_level} /></SidebarRow>
            {skill.metrics?.github_stars != null && <SidebarRow label="stars">{formatNumber(skill.metrics.github_stars)}</SidebarRow>}
            {skill.metrics?.github_forks != null && <SidebarRow label="forks">{formatNumber(skill.metrics.github_forks)}</SidebarRow>}
            {skill.metrics?.external_installs != null && <SidebarRow label="installs">{formatNumber(skill.metrics.external_installs)}</SidebarRow>}
            {skill.metrics?.github_license && <SidebarRow label="license">{skill.metrics.github_license}</SidebarRow>}
          </SidebarSection>

          {fbTotal > 0 && (
            <SidebarSection title="Feedback">
              <SidebarRow label="success">
                <span className="text-accent">{fbSuccess}</span>
                {successRate != null && <span className="text-fog-500 text-2xs ml-2">({successRate}%)</span>}
              </SidebarRow>
              <SidebarRow label="failure"><span className="text-bad">{fbFailure}</span></SidebarRow>
              {fbPartial > 0 && <SidebarRow label="partial"><span className="text-warn">{fbPartial}</span></SidebarRow>}
              {(skill.feedback_stats?.common_failure_codes ?? []).slice(0, 3).map((c) => (
                <SidebarRow key={c.code} label="↳ fail">
                  <span className="font-mono text-2xs text-fog-300">{c.code}</span>
                  <span className="text-fog-500 ml-1">×{c.count}</span>
                </SidebarRow>
              ))}
            </SidebarSection>
          )}

          {skill.env_vars?.length > 0 && (
            <SidebarSection title="Env vars">
              <div className="flex flex-wrap gap-1.5">
                {skill.env_vars.slice(0, 12).map((v) => (
                  <span key={v} className="font-mono text-2xs px-1.5 py-0.5 rounded bg-ink-soft text-fog-300 border border-ink-line">{v}</span>
                ))}
              </div>
            </SidebarSection>
          )}

          {skill.commands?.length > 0 && (
            <SidebarSection title="Commands">
              <div className="flex flex-wrap gap-1.5">
                {skill.commands.slice(0, 12).map((c) => (
                  <span key={c} className="font-mono text-2xs px-1.5 py-0.5 rounded bg-ink-soft text-fog-300 border border-ink-line">{c}</span>
                ))}
              </div>
            </SidebarSection>
          )}

          <SidebarSection title="Use it">
            <pre className="font-mono text-2xs text-fog-200 bg-ink-soft border border-ink-line rounded-lg p-3 overflow-x-auto">
              <code>{`upskill find "${skill.name}"
upskill inspect ${skill.skill_id}`}</code>
            </pre>
          </SidebarSection>
        </aside>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-2xs uppercase tracking-micro text-fog-500 font-mono mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-2xs font-mono text-fog-500 uppercase tracking-micro shrink-0 w-14">{label}</span>
      <span className="text-fog-200 text-right truncate">{children}</span>
    </div>
  );
}
