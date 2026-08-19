import { notFound } from "next/navigation";
import Link from "next/link";
import { Repo } from "@/lib/db/store";
import { scoreOpportunity, FACTOR_LABELS, normaliseWeights } from "@/lib/scoring/engine";
import { ScoreDonut, TierPill } from "@/components/ScoreBadge";
import { StageControl } from "@/components/StageControl";
import { BuzzSpark } from "@/components/BuzzSpark";
import type { FactorKey } from "@/lib/types";
import { Topbar } from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [raw, config] = await Promise.all([Repo.opportunity(id), Repo.config()]);
  if (!raw) return notFound();
  const o = scoreOpportunity(raw, config);
  const w = normaliseWeights(config.weights);

  return (
    <>
      <Topbar title="Opportunity Dossier" subtitle="Evidence, commercial gap, and a path to action" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 48px", maxWidth: 1180 }}>
      <Link href="/pipeline" style={{ fontSize: 13, color: "var(--muted)" }}>← Back to pipeline</Link>

      {/* Image banner */}
      {o.image && (
        <div className="glass gold-edge" style={{ position: "relative", height: 200, overflow: "hidden", marginTop: 12, borderRadius: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.image.replace("w=1000", "w=1600")} alt={o.imageAlt || o.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,11,22,0.1), rgba(7,11,22,0.82))" }} />
          <div style={{ position: "absolute", bottom: 14, left: 18, right: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <span className="badge badge-gold">{o.vertical}</span>
                <span className="badge">{o.category}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>{o.brand}</div>
            </div>
          </div>
          <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, color: "var(--muted-2)", background: "rgba(7,11,22,0.5)", padding: "3px 8px", borderRadius: 8 }}>Representative category imagery</div>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ padding: 22, marginTop: 14, display: "flex", gap: 22, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span className="badge">{o.vertical}</span>
            <span className="badge">{o.category}</span>
            <span className="badge">🌍 {o.city}, {o.country}</span>
            <span className="badge">{o.signalType}</span>
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 820, lineHeight: 1.2 }}>{o.title}</h1>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>{o.brand} · {o.company}</div>
          <div style={{ marginTop: 14 }}><TierPill tier={o.tier} /></div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <ScoreDonut score={o.score} tier={o.tier} size={104} />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Attractiveness {o.attractiveness} · Feasibility {o.feasibility}
          </div>
          <div className="badge" style={{ marginTop: 6 }}>{o.quadrant}</div>
        </div>
      </div>

      {o.sufficientEvidence === false && (
        <div className="card" style={{ padding: 16, marginTop: 14, borderColor: "#f0d28a" }}>
          <b style={{ color: "var(--warn)" }}>⚠ INSUFFICIENT EVIDENCE.</b>{" "}
          <span className="muted">Not enough independent, grounded sources to make a confident recommendation. Shown for monitoring only — validate before acting.</span>
        </div>
      )}

      {/* Pipeline stage */}
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>Opportunity Pipeline Stage</div>
        <StageControl id={o.id} stage={o.stage} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14, alignItems: "start" }}>
        {/* Recommendation */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🎯 AI Recommendation</h2>
          <Field label="Opportunity" value={o.recommendation.opportunity} />
          <Field label="Market Signal" value={o.recommendation.marketSignal} />
          <Field label="Why Now?" value={o.recommendation.whyNow} />
          <Field label="BIAL Gap" value={o.recommendation.bialGap} />
          <Field label="BIAL Recommendation" value={o.recommendation.bialRecommendation} strong />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Mini label="Potential Location" value={o.recommendation.potentialLocation} />
            <Mini label="Target Passenger" value={o.recommendation.targetPassenger} />
            <Mini label="Commercial Potential" value={o.recommendation.commercialPotential} />
            <Mini label="Implementation" value={o.recommendation.implementationComplexity} />
          </div>
          <Field label="Expected Strategic Value" value={o.recommendation.expectedStrategicValue} />
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--line-strong)" }}>
            <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>▶ Recommended Next Action</div>
            <div style={{ marginTop: 6, fontSize: 14 }}>{o.recommendation.recommendedNextAction}</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="card" style={{ padding: 20 }}>
          {o.buzz && (
            <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
              <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 15, fontWeight: 750 }}>📈 Buzz Longevity <Link href="/methodology" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 400 }}>· model ↗</Link></h2>
              <BuzzSpark buzz={o.buzz} w={150} h={40} />
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>{o.buzz.note}</div>
            </div>
          )}
          <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>📊 Factor Breakdown</h2>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Weighted 0–100 · weights configurable in Admin</div>
          {(Object.keys(o.factors) as FactorKey[]).map((k) => {
            const val = o.factors[k];
            const weight = w[k];
            return (
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{FACTOR_LABELS[k]} <span className="muted">· {weight.toFixed(0)}%</span></span>
                  <b>{val}</b>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${val}%`, height: "100%", background: "linear-gradient(90deg,#e8ebee,#8a929a)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence */}
      <div className="card" style={{ padding: 20, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🔍 Why are we saying this? — Evidence Trail</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {o.evidence.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, border: "1px solid var(--line)" }}>
              <span className="badge" style={{ flexShrink: 0, height: "fit-content" }}>Tier {e.tier}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{e.role}</div>
                <div style={{ fontWeight: 650, marginTop: 2 }}>{e.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>&ldquo;{e.excerpt}&rdquo;</div>
                <div style={{ fontSize: 12, marginTop: 5 }}>
                  {e.url && e.url !== "#" ? (
                    <a href={e.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{e.publisher} ↗</a>
                  ) : (
                    <span className="muted">{e.publisher}</span>
                  )}
                  {e.publishedAt && <span className="muted"> · {e.publishedAt}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div className="card" style={{ padding: 20, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🤝 Business Development Contact</h2>
        {o.contacts.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>No public business contact identified yet. Contact Intelligence agent runs at Validated stage.</div>
        ) : (
          o.contacts.map((c) => (
            <div key={c.id} style={{ padding: 14, borderRadius: 10, border: "1px solid var(--line)", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.personName || c.designation}</div>
                  {c.personName && <div style={{ fontSize: 13, color: "var(--muted)" }}>{c.designation}</div>}
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{c.company}</div>
                </div>
                <span
                  className="badge"
                  style={{
                    borderColor: c.verification.startsWith("Verified") ? "#a7e0b8" : "#f0d28a",
                    color: c.verification.startsWith("Verified") ? "var(--ok)" : "var(--warn)",
                    background: c.verification.startsWith("Verified") ? "rgba(127,214,160,0.15)" : "rgba(224,184,119,0.15)",
                  }}
                >
                  {c.verification.startsWith("Verified") ? "✓ Verified public" : "◐ AI-inferred — verify"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", fontSize: 12.5 }}>
                {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>LinkedIn ↗</a>}
                {c.companyWebsite && c.companyWebsite !== "#" && <a href={c.companyWebsite} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Website ↗</a>}
                {c.publicBusinessEmail && <span className="muted">{c.publicBusinessEmail}</span>}
                {c.sourceUrl && <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="muted">source ↗</a>}
                <span className="muted">Confidence {c.confidence}%</span>
              </div>
              {c.note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, fontStyle: "italic" }}>{c.note}</div>}
            </div>
          ))
        )}
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          Public professional/business information only. No private/personal data is collected. Inferred data is never presented as verified.
        </div>
      </div>
      </div>
    </>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: 14, fontWeight: strong ? 650 : 400 }}>{value}</div>
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
