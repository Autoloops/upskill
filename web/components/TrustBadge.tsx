import type { TrustLevel } from "@/lib/api";
import { cn } from "@/lib/utils";

const LABEL: Record<TrustLevel, string> = {
  verified: "verified",
  reviewed: "reviewed",
  community: "community"
};

const STYLE: Record<TrustLevel, string> = {
  verified: "pill-accent",
  reviewed: "pill-purple",
  community: "pill-fog"
};

export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  return <span className={cn("pill", STYLE[level], className)}>{LABEL[level]}</span>;
}
