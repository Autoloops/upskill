import Link from "next/link";
import type { SkillSummary } from "@/lib/api";
import { TrustBadge } from "./TrustBadge";
import { cn, formatNumber, repoFromLocator } from "@/lib/utils";

const ARROW = "→";

export function SkillCard({
  skill,
  rank
}: {
  skill: SkillSummary;
  rank?: number;
}) {
  const { owner, repo, path } = repoFromLocator(skill.skill_id);
  const trust = skill.trust_level ?? "community";
  return (
    <Link
      href={`/skills/${encodeURIComponent(skill.skill_id)}`}
      className={cn(
        "panel panel-hover group relative block px-5 py-4",
        "animate-fade-up"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {rank != null && (
              <span className="font-mono text-2xs text-fog-400 tabular-nums w-7">
                {String(rank).padStart(2, "0")}
              </span>
            )}
            <span className="text-fog-100 font-medium tracking-tight truncate">
              {skill.name}
            </span>
            <TrustBadge level={trust} />
          </div>
          <p className="text-fog-300 text-sm leading-relaxed line-clamp-2 mb-2">
            {skill.description}
          </p>
          <div className="flex items-center gap-3 text-2xs text-fog-400">
            <span className="font-mono">
              <span className="text-fog-300">{owner}/</span>
              <span className="text-fog-200">{repo}</span>
              {path && <span className="text-fog-400">/{path}</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-3 font-mono text-2xs text-fog-400 tabular-nums">
            {skill.score != null && (
              <span title="hybrid relevance score">
                <span className="text-fog-500">score=</span>
                <span className="text-fog-200">{skill.score.toFixed(2)}</span>
              </span>
            )}
            {skill.github_stars != null && (
              <span title="github stars">
                <span className="text-fog-500">★</span> {formatNumber(skill.github_stars)}
              </span>
            )}
            {skill.external_installs != null && skill.external_installs > 0 && (
              <span title="installs">
                <span className="text-fog-500">⇣</span> {formatNumber(skill.external_installs)}
              </span>
            )}
          </div>
          <span className="text-fog-500 group-hover:text-accent transition-colors text-sm">
            {ARROW}
          </span>
        </div>
      </div>
    </Link>
  );
}
