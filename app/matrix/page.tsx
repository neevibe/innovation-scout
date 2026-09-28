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
      <div className="cx-matrix" style={{ padding: "28px clamp(16px,3vw,40px)", display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 20, overflow: "auto" }}>
          <svg width={W} height={H} style={{ maxWidth: "100%" }}>
            {/* quadrant fills */}
            <rect x={px(fy)} y={pad} width={W - pad - px(fy)} height={py(ax) - pad} fill="rgba(240,180,41,.07)" />
            <rect x={pad} y={pad} width={px(fy) - pad} height={py(ax) - pad} fill="rgba(127,212,255,.04)" />
            <rect x={px(fy)} y={py(ax)} width={W - pad - px(fy)} height={H - pad - py(ax)} fill="rgba(255,122,69,.04)" />
            <rect x={pad} y={py(ax)} width={px(fy) - pad} height={H - pad - py(ax)} fill="rgba(255,255,255,.015)" />

            {/* grid lines */}
            <line x1={px(fy)} y1={pad} x2={px(fy)} y2={H - pad} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            <line x1={pad} y1={py(ax)} x2={W - pad} y2={py(ax)} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            {/* axes */}
            <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,0.22)" />
            <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="rgba(255,255,255,0.22)" />

            {/* quadrant labels */}
            <text x={W - pad - 8} y={pad + 16} textAnchor="end" fill="#F0B429" fontSize="10" letterSpacing="2.4" fontFamily="var(--font-mono)">DO NOW</text>
            <text x={pad + 8} y={pad + 16} fill="#7FD4FF" fontSize="10" letterSpacing="2.4" fontFamily="var(--font-mono)">PILOT</text>
            <text x={W - pad - 8} y={H - pad - 8} textAnchor="end" fill="#FF7A45" fontSize="10" letterSpacing="2.4" fontFamily="var(--font-mono)">QUICK WIN</text>
            <text x={pad + 8} y={H - pad - 8} fill="#5C6675" fontSize="10" letterSpacing="2.4" fontFamily="var(--font-mono)">DEPRIORITISE</text>

            {/* axis titles */}
            <text x={W / 2} y={H - 10} textAnchor="middle" fill="#6E7A8A" fontSize="10" letterSpacing="2.2" fontFamily="var(--font-mono)">IMPLEMENTATION FEASIBILITY →</text>
            <text x={16} y={H / 2} textAnchor="middle" fill="#6E7A8A" fontSize="10" letterSpacing="2.2" fontFamily="var(--font-mono)" transform={`rotate(-90 16 ${H / 2})`}>MARKET ATTRACTIVENESS →</text>

            {/* points */}
            {opportunities.map((o) => {
              const x = px(o.feasibility);
              const y = py(o.attractiveness);
              const color = TIER_META[o.tier].color;
              return (
                <g key={o.id}>
                  <circle cx={x} cy={y} r={o.sufficientEvidence ? 9 : 6} fill={color} fillOpacity={0.95} stroke="#04060A" strokeWidth={2} />
                  <text x={x + 12} y={y + 4} fill="#EDE9E1" fontSize="11.5">{o.brand.length > 16 ? o.brand.slice(0, 15) + "…" : o.brand}</text>
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
                <div className="cx-serif" style={{ fontSize: 24, lineHeight: 1.1 }}>{q}</div>
                <div className="cx-kicker" style={{ fontSize: 9, margin: "4px 0 10px" }}>{QUADRANT_META[q].blurb}</div>
                {items.map((o) => (
                  <Link key={o.id} href={`/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--line)", alignItems: "baseline" }}>
                    <span style={{ color: "var(--head)" }}>{o.brand}</span>
                    <span className="cx-serif" style={{ fontSize: 20, color: "var(--gold)" }}>{o.score}</span>
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
