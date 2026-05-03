import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86_400 * 30) return `${Math.floor(s / 86_400)}d ago`;
  if (s < 86_400 * 365) return `${Math.floor(s / (86_400 * 30))}mo ago`;
  return `${Math.floor(s / (86_400 * 365))}y ago`;
}

export function repoFromLocator(sourceLocator: string): { owner: string; repo: string; path: string } {
  // "github:owner/repo/path/to/skill" → { owner, repo, path }
  const stripped = sourceLocator.replace(/^github:/, "");
  const parts = stripped.split("/");
  return {
    owner: parts[0] ?? "",
    repo: parts[1] ?? "",
    path: parts.slice(2).join("/")
  };
}
