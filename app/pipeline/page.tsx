import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { TIER_META } from "@/lib/scoring/engine";
import type { OpportunityStage } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGES: OpportunityStage[] = [
  "Discovered", "Validated", "Contact Identified", "BIAL Outreach", "Discussion",
  "Commercial Evaluation", "Pilot", "Approved", "Implementation", "Live", "Measured",
];

export default async function PipelinePage() {
  const { config, opportunities } = await getPageData();

  return (
    <>
      <Topbar title="Opportunity Pipeline" subtitle="Discovered → Validated → Contact → Outreach → Evaluation → Pilot → Live → Measured" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
          {STAGES.map((stage) => {
            const items = opportunities.filter((o) => o.stage === stage);
            return (
              <div key={stage} style={{ minWidth: 250, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 10px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{stage}</span>
                  <span className="badge">{items.length}</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((o) => (
                    <Link key={o.id} href={`/opportunities/${o.id}`} className="card" style={{ padding: 12, display: "block", borderLeft: `3px solid ${TIER_META[o.tier].color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{o.brand}</span>
                        <b style={{ fontSize: 15 }}>{o.score}</b>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{o.vertical} · {o.city}</div>
                      <div style={{ fontSize: 12, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.recommendation.recommendedNextAction}</div>
                    </Link>
                  ))}
                  {items.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: 8, border: "1px dashed var(--line)", borderRadius: 10, textAlign: "center" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Open an opportunity to advance its stage. Stage changes persist to the store.</div>
      </div>
    </>
  );
}
