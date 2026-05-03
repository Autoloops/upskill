import { getStats } from "@/lib/api";
import { formatNumber, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function StatsPage() {
  let s: Awaited<ReturnType<typeof getStats>> | null = null;
  let error: string | null = null;
  try { s = await getStats(); } catch (e) { error = (e as Error).message; }

  return (
    <div className="container-tight py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fog-100 mb-2">Registry stats</h1>
        <p className="text-fog-300 text-sm">
          Published, searchable skills — what your agent can actually reach for. Updated as new skills land in the registry.
        </p>
      </div>

      {error && (
        <div className="panel px-5 py-4 text-bad text-sm">
          The /api/v1/stats endpoint failed. <span className="font-mono text-2xs text-fog-400">{error}</span>
        </div>
      )}

      {s && (
        <>
          {/* Top stats — published-focused only */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
            <BigStat label="Published skills" value={formatNumber(s.published)} accent />
            <BigStat label="Verified · vendor-official" value={formatNumber(s.by_trust_level?.verified ?? 0)} />
            <BigStat label="Reviewed · curated" value={formatNumber(s.by_trust_level?.reviewed ?? 0)} />
            <BigStat label="Last indexed" value={relativeTime(s.last_indexed_at)} small />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel px-5 py-4">
              <div className="text-2xs uppercase tracking-micro text-fog-500 font-mono mb-4">Trust breakdown</div>
              <TrustBars data={s.by_trust_level} total={s.published} />
              <p className="text-2xs text-fog-500 mt-4 leading-relaxed">
                <span className="text-accent font-medium">Verified</span> repos are vendor-official.{" "}
                <span className="text-purple font-medium">Reviewed</span> are curated by recognized practitioners.{" "}
                <span className="text-fog-300 font-medium">Community</span> is everyone else.
              </p>
            </div>
            <div className="panel px-5 py-4">
              <div className="text-2xs uppercase tracking-micro text-fog-500 font-mono mb-4">By category</div>
              <CategoryList data={s.by_category} total={s.published} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BigStat({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="panel px-5 py-4">
      <div className="text-2xs uppercase tracking-micro text-fog-500 font-mono">{label}</div>
      <div className={`mt-1 ${small ? "text-base mt-2" : "text-3xl"} font-bold tabular-nums ${accent ? "text-accent" : "text-fog-100"}`}>
        {value}
      </div>
    </div>
  );
}

function TrustBars({ data, total }: { data: Record<string, number>; total: number }) {
  const order: Array<{ key: string; label: string; color: string }> = [
    { key: "verified", label: "verified · vendor-official", color: "bg-accent" },
    { key: "reviewed", label: "reviewed · curated", color: "bg-purple" },
    { key: "community", label: "community", color: "bg-fog-400" }
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-2 rounded-full overflow-hidden bg-ink-soft">
        {order.map(({ key, color }) => {
          const v = data[key] ?? 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          return <div key={key} className={color} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="space-y-1.5">
        {order.map(({ key, label, color }) => {
          const v = data[key] ?? 0;
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center justify-between text-2xs font-mono">
              <span className="flex items-center gap-2 text-fog-300">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </span>
              <span className="tabular-nums">
                <span className="text-fog-100 font-semibold">{formatNumber(v)}</span>
                <span className="text-fog-500 ml-1.5">{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryList({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (!entries.length) return <div className="text-fog-500 text-sm">No category data.</div>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div className="space-y-2">
      {entries.map(([cat, v]) => {
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        const w = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={cat} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 text-2xs font-mono">
            <span className="text-fog-300 truncate">{cat.replace(/_/g, " ")}</span>
            <div className="h-1.5 rounded-full bg-ink-soft overflow-hidden">
              <div className="h-full bg-accent/60" style={{ width: `${w}%` }} />
            </div>
            <span className="tabular-nums text-fog-400 w-12 text-right">{formatNumber(v)} <span className="text-fog-500">{pct}%</span></span>
          </div>
        );
      })}
    </div>
  );
}
