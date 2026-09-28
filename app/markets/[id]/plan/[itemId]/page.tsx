import { notFound } from "next/navigation";
import Link from "next/link";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { DomainBadge } from "@/components/DomainBadge";
import { getPageData } from "@/lib/view";
import { buildCitySectionBreakdown } from "@/lib/intelligence/citySections";
import { generateBusinessPlan } from "@/lib/intelligence/businessPlan";
import type { CityBucketItem } from "@/lib/types";
import { SECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BusinessPlanPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const [cities, signals, portfolio, dutyFreeSkus, candidates] = await Promise.all([
    Repo.cities(), Repo.signals(), Repo.portfolio(), Repo.dutyFreeSkus(), Repo.candidates(),
  ]);
  const city = cities.find((c) => c.id === id);
  if (!city) return notFound();
  const { config, opportunities } = await getPageData();
  const breakdown = buildCitySectionBreakdown(city, signals, candidates, opportunities, portfolio, dutyFreeSkus);

  let item: CityBucketItem | undefined;
  for (const section of SECTIONS) {
    const found = breakdown.sections[section].find((x) => x.id === itemId);
    if (found) { item = found; break; }
  }
  // The item may have been trimmed out of the top-5 view but still exist —
  // fall back to a direct lookup across the raw records so a deep-link never
  // 404s just because it wasn't in someone's top-5 slice.
  if (!item) {
    const sig = signals.find((s) => s.id === itemId);
    const cand = candidates.find((c) => c.id === itemId);
    const opp = opportunities.find((o) => o.id === itemId);
    if (!sig && !cand && !opp) return notFound();
  }
  if (item?.atBial) {
    // Nothing to plan — redirect the user's intent by showing the "why" instead.
  }

  const opportunity = opportunities.find((o) => o.id === (item?.opportunityId || itemId));
  const resolvedItem = item || {
    id: itemId,
    kind: "opportunity" as const,
    name: opportunity?.brand || "Unknown",
    isNamedBrand: !!opportunity?.brand,
    vertical: opportunity?.vertical || "Retail",
    city: city.name,
    score: opportunity?.score || 0,
    feasibility: 0,
    atBial: false,
    bialNote: "",
    why: opportunity?.recommendation.marketSignal || "",
    sourceLabel: "",
    sourceUrl: "#",
    confidence: 0,
  };

  const plan = generateBusinessPlan(resolvedItem, city, opportunity);

  return (
    <>
      <Topbar title={plan.title} subtitle={`Generated business plan · ${plan.generatedFrom === "opportunity" ? "from a full scored Opportunity dossier" : "heuristic first-pass — validate before acting"}`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "26px 34px 48px", maxWidth: 980 }}>
        <Link href={`/markets/${city.id}`} style={{ fontSize: 13, color: "var(--muted)" }}>← Back to {city.name}</Link>

        <div className="card" style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <DomainBadge vertical={plan.vertical} />
            <span className="badge">{plan.city}</span>
            {plan.generatedFrom === "heuristic" && (
              <span className="badge" style={{ borderColor: "#f0d28a", color: "var(--warn)" }}>⚠ First-pass — not yet a validated Opportunity</span>
            )}
            {opportunity && (
              <Link href={`/opportunities/${opportunity.id}`} className="badge" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>View full Opportunity dossier ↗</Link>
            )}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{plan.summary}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>The Plan</h2>
            <Field label="Market Signal" value={plan.marketSignal} />
            <Field label="Why Now?" value={plan.whyNow} />
            <Field label="BIAL Gap" value={plan.bialGap} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <Mini label="Proposed Format" value={plan.proposedFormat} />
              <Mini label="Target Location" value={plan.targetLocation} />
              <Mini label="Target Passenger" value={plan.targetPassenger} />
            </div>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--line-strong)" }}>
              <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>Commercial Model — Planning Assumption</div>
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.55 }}>{plan.commercialModelNote}</div>
            </div>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "rgba(240,180,41,.08)", border: "1px solid rgba(240,180,41,.24)" }}>
              <div style={{ fontSize: 11, color: "var(--warn)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>▶ Recommended Next Action</div>
              <div style={{ marginTop: 6, fontSize: 14 }}>{plan.nextAction}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>Risks to Validate</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {plan.risks.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.5 }}>
                  <span style={{ color: "var(--warn)" }}>!</span><span>{r}</span>
                </div>
              ))}
            </div>
            <h2 style={{ marginTop: 20, fontSize: 15, fontWeight: 750 }}>Evidence</h2>
            {plan.evidence.length === 0 ? (
              <div className="muted" style={{ fontSize: 12.5 }}>No linkable source captured yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {plan.evidence.map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--accent)" }}>{e.label} ↗</a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginTop: 14 }}>
          <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>Phased Path to Action</h2>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 180px), 1fr))`, gap: 12, marginTop: 14 }}>
            {plan.phases.map((p, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)" }}>
                <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{p.timeframe}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{p.phase}</div>
                <ul style={{ margin: "10px 0 0", paddingLeft: 16, fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
                  {p.actions.map((a, j) => (<li key={j}>{a}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: 14 }}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 10, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: 13, fontWeight: 650 }}>{value}</div>
    </div>
  );
}
