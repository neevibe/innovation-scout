import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { QUADRANT_META, TIER_META } from "@/lib/scoring/engine";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatrixPage() {
  const { config, opportunities } = await getPageData();
  const ax = config.thresholds.matrixAttractiveness;
  const fy = config.thresholds.matrixFeasibility;

  const W = 720, H = 520, pad = 44;
  const px = (v: number) => pad + (v / 100) * (W - 2 * pad);
  const py = (v: number) => H - pad - (v / 100) * (H - 2 * pad);

  return (
    <>
      <Topbar title="BIAL Opportunity Matrix" subtitle="Market Attractiveness vs BIAL Implementation Feasibility" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "auto 320px", gap: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 20, overflow: "auto" }}>
          <svg width={W} height={H} style={{ maxWidth: "100%" }}>
            {/* quadrant fills */}
            <rect x={px(fy)} y={pad} width={W - pad - px(fy)} height={py(ax) - pad} fill="rgba(34,197,94,.06)" />
            <rect x={pad} y={pad} width={px(fy) - pad} height={py(ax) - pad} fill="rgba(129,140,248,.06)" />
            <rect x={px(fy)} y={py(ax)} width={W - pad - px(fy)} height={H - pad - py(ax)} fill="rgba(234,179,8,.05)" />
            <rect x={pad} y={py(ax)} width={px(fy) - pad} height={H - pad - py(ax)} fill="rgba(100,116,139,.05)" />

            {/* grid lines */}
            <line x1={px(fy)} y1={pad} x2={px(fy)} y2={H - pad} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            <line x1={pad} y1={py(ax)} x2={W - pad} y2={py(ax)} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            {/* axes */}
            <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,0.22)" />
            <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="rgba(255,255,255,0.22)" />

            {/* quadrant labels */}
            <text x={W - pad - 8} y={pad + 16} textAnchor="end" fill="#7fd6a0" fontSize="12" fontWeight="700">🚀 Do Now</text>
            <text x={pad + 8} y={pad + 16} fill="#b9c6d6" fontSize="12" fontWeight="700">🔬 Pilot</text>
            <text x={W - pad - 8} y={H - pad - 8} textAnchor="end" fill="#e0b877" fontSize="12" fontWeight="700">⚡ Quick Win</text>
            <text x={pad + 8} y={H - pad - 8} fill="#9aa2aa" fontSize="12" fontWeight="700">❌ Deprioritise</text>

            {/* axis titles */}
            <text x={W / 2} y={H - 10} textAnchor="middle" fill="#a7aeb5" fontSize="12">Implementation Feasibility →</text>
            <text x={16} y={H / 2} textAnchor="middle" fill="#a7aeb5" fontSize="12" transform={`rotate(-90 16 ${H / 2})`}>Market Attractiveness →</text>

            {/* points */}
            {opportunities.map((o) => {
              const x = px(o.feasibility);
              const y = py(o.attractiveness);
              const color = TIER_META[o.tier].color;
              return (
                <g key={o.id}>
                  <circle cx={x} cy={y} r={o.sufficientEvidence ? 9 : 6} fill={color} fillOpacity={0.95} stroke="#2c333b" strokeWidth={2} />
                  <text x={x + 12} y={y + 4} fill="#f3f4f5" fontSize="11" fontWeight="600">{o.brand.length > 16 ? o.brand.slice(0, 15) + "…" : o.brand}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {(Object.keys(QUADRANT_META) as (keyof typeof QUADRANT_META)[]).map((q) => {
            const items = opportunities.filter((o) => o.quadrant === q);
            return (
              <div key={q} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 720, fontSize: 14 }}>{QUADRANT_META[q].emoji} {q}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{QUADRANT_META[q].blurb}</div>
                {items.map((o) => (
                  <Link key={o.id} href={`/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span style={{ color: "var(--accent)" }}>{o.brand}</span>
                    <b>{o.score}</b>
                  </Link>
                ))}
                {items.length === 0 && <div className="muted" style={{ fontSize: 12 }}>—</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
