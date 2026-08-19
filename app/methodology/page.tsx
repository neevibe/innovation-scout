import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { BuzzSpark } from "@/components/BuzzSpark";
import { MarketChart } from "@/components/MarketChart";
import { DomainBadge } from "@/components/DomainBadge";
import { FACTOR_LABELS, normaliseWeights } from "@/lib/scoring/engine";
import type { FactorKey } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DOM = [
  { code: "DEL", city: "Delhi", pax: 1694647, atm: 9607, slf: 83.6, pick: true },
  { code: "BOM", city: "Mumbai", pax: 1249529, atm: 7339, slf: 75.3, pick: true },
  { code: "CCU", city: "Kolkata", pax: 706128, atm: 3544, slf: 91.6, pick: true },
  { code: "PNQ", city: "Pune", pax: 672246, atm: 3981, slf: 76.9, pick: false },
  { code: "HYD", city: "Hyderabad", pax: 658241, atm: 3853, slf: 87.7, pick: false },
];
const INT = [
  { code: "DXB", city: "Dubai", pax: 306923, atm: 976, slf: 93.9, pick: true },
  { code: "SIN", city: "Singapore", pax: 207431, atm: 956, slf: 90.2, pick: true },
  { code: "LHR", city: "London", pax: 192522, atm: 941, slf: 90.3, pick: true },
  { code: "AUH", city: "Abu Dhabi", pax: 165324, atm: 1001, slf: 86.2, pick: false },
  { code: "KUL", city: "Kuala Lumpur", pax: 136392, atm: 849, slf: 89.4, pick: false },
];

export default async function MethodologyPage() {
  const [{ config, opportunities }, cfg] = await Promise.all([getPageData(), Repo.config()]);
  const w = normaliseWeights(cfg.weights);
  const examples = opportunities.filter((o) => o.buzz).slice(0, 4);

  return (
    <>
      <Topbar title="Selection Methodology" subtitle="The data-science model behind every market, brand and score — fully auditable" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 56px", maxWidth: 980 }}>

        {/* Pipeline */}
        <Section n="01" title="The funnel — how a market signal becomes a defensible pick">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 12.5 }}>
            {["Market selection", "Multi-source scrape", "Buzz qualification", "Opportunity scoring", "Evidence + contact", "Recommendation"].map((s, i, a) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="badge badge-accent">{s}</span>
                {i < a.length - 1 && <span style={{ color: "var(--muted-2)" }}>→</span>}
              </span>
            ))}
          </div>
          <P>Nothing is chosen by taste. Each stage has an explicit input, metric and threshold, and everything below is traceable to a source. The two questions this page answers: <b>why these markets</b>, and <b>why these brands</b>.</P>
          <Callout>
            <b>Scope = any commercial opportunity, not just F&amp;B/retail/duty-free.</b> The system covers brands, individual <b>products &amp; SKUs</b>, <b>services</b> (forex, eSIM, luggage, valet, meet-&amp;-greet), <b>experiences</b> &amp; activations, <b>wellness</b> (spa, sleep pods), <b>technology</b> (phygital, click-&amp;-collect, biometric, loyalty), <b>travel services</b> and <b>media &amp; advertising</b> — anything that grows non-aero revenue or passenger experience.
          </Callout>
        </Section>

        {/* Market model */}
        <Section n="02" title="Market Selection Model — why these six cities">
          <P><b>Input:</b> BIAL traffic data (Apr–Aug 2026), arrivals + departures per sector — <span className="kbd">ATM</span> (flights), <span className="kbd">Pax</span> (passengers), <span className="kbd">SLF</span> (seat load factor).</P>
          <P><b>Primary metric = Passengers, not flights.</b> This is a <i>retail</i> system: the addressable audience at BIAL is people, not aircraft. Raw flight count over-weights short-haul, high-frequency, small-aircraft routes. <b>SLF</b> is the tie-breaker (how full = how real the demand). Flights are tertiary (access/frequency).</P>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
            <RankTable title="Domestic (from BLR)" rows={DOM} />
            <RankTable title="International (from BLR)" rows={INT} />
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Interactive — flights (x) vs passengers (y), size = load factor</div>
            <MarketChart
              domestic={DOM.map((r) => ({ ...r }))}
              international={INT.map((r) => ({ ...r }))}
            />
          </div>
          <Eq label="Market Priority score (per city)" eq="MP = 0.60·P̂ + 0.25·L̂ + 0.15·F̂" note="P̂, L̂, F̂ = min-max-normalised Passengers, Load-factor, Flights. Passengers dominate (retail = footfall); load factor rewards genuine demand; flights count least." />
          <Callout>
            The metric choice changes the answer — and that's the point. By <b>flights</b>, the #3 domestic would be <b>Pune</b> (3,981 ATM) and the #1 international would be <b>Abu Dhabi</b> (1,001 ATM). But Pune runs only <b>76.9%</b> full vs Kolkata's <b>91.6%</b>, and Abu Dhabi carries <b>165k</b> pax vs London's <b>193k</b>. On footfall + load — the retail-correct axis — the picks are <b>Delhi · Mumbai · Kolkata</b> and <b>Dubai · Singapore · London</b>.
          </Callout>
        </Section>

        {/* Scrape */}
        <Section n="03" title="Multi-source scrape — think like a human analyst, read everything">
          <P>For each market × lens (retail · F&B · duty-free · experiential · D2C), the collector sweeps four source tiers and consolidates duplicates (N publications → one event):</P>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginTop: 8 }}>
            <Tier n="Tier 1 · Official" items="Airport & brand sites, company announcements, government / regulatory" />
            <Tier n="Tier 2 · Media" items="Reuters, ET, Livemint, Forbes, trade press (Moodie Davitt)" />
            <Tier n="Tier 3 · Industry" items="Inc42, D2C Insider, World Coffee Portal, sector reports" />
            <Tier n="Tier 4 · Social" items="Instagram, LinkedIn, Reddit, X, YouTube, influencer indices, review platforms" />
          </div>
          <P>Every extracted claim carries its source URL and tier. A recommendation needs <b>≥2 independent sources</b>; below that it is stamped <span className="badge" style={{ borderColor: "#e0b877", color: "var(--warn)" }}>Insufficient evidence</span> and never presented as a confident call.</P>
        </Section>

        {/* Buzz model */}
        <Section n="04" title="Buzz-Longevity Model — is it a trend, or a one-month spike?">
          <P>The exact risk you raised: a name buzzes for a month, then dies. We observe a <b>6-month window</b> (matched to the BLR data window) and, per brand/concept, compute a monthly <b>buzz index (0–100)</b> from <i>evidence density × recency × source diversity</i>. From that series:</P>
          <ul style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", paddingLeft: 18 }}>
            <li><b style={{ color: "var(--text)" }}>Persistence</b> = months-active ÷ window. High = durable.</li>
            <li><b style={{ color: "var(--text)" }}>Momentum (slope)</b> = direction of the monthly series — rising, flat, or falling.</li>
            <li><b style={{ color: "var(--text)" }}>Trajectory class</b> — the label attached to every pick:</li>
          </ul>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 6 }}>
            <Traj c="#7fd6a0" name="Accelerating" d="Present most months, rising — promote" />
            <Traj c="#b9c6d6" name="Sustained" d="Present all/most months, steady — promote" />
            <Traj c="#7fd6a0" name="Emerging" d="New + rising, <3 mo — watch/validate" />
            <Traj c="#d8c98a" name="Plateauing" d="High but flat — hold" />
            <Traj c="#e0b877" name="Fading" d="Declining — demote" />
            <Traj c="#e8908f" name="Spike-and-fade" d="One/two-month event spike — DEMOTE; import the format, not the brand" />
          </div>
          <Eq label="Persistence" eq="ρ = monthsActive ÷ windowMonths" note="Fraction of the window in which the brand showed measurable buzz. ρ = 1 → present every month." />
          <Eq label="Momentum (slope)" eq="μ = (b_last − b_first) ÷ (windowMonths − 1)" note="Average month-on-month change of the buzz index b. μ > 0 rising, μ < 0 fading." />
          <Eq label="Promotion rule" eq="promote ⇔ (ρ ≥ 0.5) ∨ (trajectory ∈ {Emerging, Accelerating})" note="A one/two-month Spike-and-fade fails both tests → demoted." />
          <Callout>
            Promotion rule: a signal becomes a scored opportunity only if <b>persistence ≥ 0.5</b> <i>or</i> the trajectory is clearly <b>Accelerating/Emerging</b>. <b>Spike-and-fade</b> items (e.g. a time-boxed pop-up) are labelled and excluded from durable-trend treatment — you import the <i>format</i>, not the fleeting name.
          </Callout>
        </Section>

        {/* Scoring model */}
        <Section n="05" title="Opportunity Scoring Model — 9 weighted factors, 0–100">
          <P>Qualified opportunities are scored on nine factors with admin-configurable weights (buzz persistence feeds <i>Market Momentum</i> and <i>Evidence Confidence</i>). Tiers: ≥{cfg.thresholds.immediate} Immediate · ≥{cfg.thresholds.highPotential} High · ≥{cfg.thresholds.monitor} Monitor.</P>
          <Eq label="Opportunity Score" eq="Score = ( Σ wᵢ · fᵢ ) ÷ ( Σ wᵢ ),  i = 1…9,  fᵢ ∈ [0,100]" note="Weighted mean of nine factor sub-scores; weights below sum to 100 and re-rank every opportunity live." />
          <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
            {(Object.keys(w) as FactorKey[]).map((k, i) => {
              const grads = ["#5b8cff", "#a06bff", "#ff6bcb", "#34e3c8", "#f59e0b", "#22c55e", "#06b6d4", "#ef4444", "#6366f1"];
              const col = grads[i % grads.length];
              return (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "180px 1fr 40px", gap: 10, alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: "var(--muted)" }}>{FACTOR_LABELS[k]}</span>
                  <span style={{ height: 8, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${(w[k] / 20) * 100}%`, background: `linear-gradient(90deg, ${col}, ${col}bb)`, borderRadius: 6 }} />
                  </span>
                  <b style={{ textAlign: "right" }}>{w[k].toFixed(0)}%</b>
                </div>
              );
            })}
          </div>
          <P><Link href="/admin" style={{ color: "var(--accent)" }}>Re-weight the model →</Link> Every score re-ranks live.</P>
        </Section>

        {/* Worked examples */}
        <Section n="06" title="Worked examples — 'why did you pick that?'">
          <P>Each promoted pick, defended by the model above:</P>
          <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
            {examples.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="card lift-card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ minWidth: 190, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{o.brand}</span>
                    <DomainBadge vertical={o.vertical} size="sm" />
                    <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{o.city}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>{o.buzz?.note}</div>
                </div>
                {o.buzz && <BuzzSpark buzz={o.buzz} />}
                <div className="tnum" style={{ fontSize: 22, fontWeight: 700 }}>{o.score}</div>
              </Link>
            ))}
          </div>
        </Section>

        {/* Coverage */}
        <Section n="07" title="Coverage target & honesty">
          <P>Operating target: <b>≥10 scored, buzz-profiled candidates per market</b> (60+ across the six), each with sources and a trajectory. The live collector (web + news + social) populates this on every refresh; the current seed shows the flagship subset from grounded research. Where evidence is thin, items stay <span className="badge" style={{ borderColor: "#e0b877", color: "var(--warn)" }}>Insufficient evidence</span> rather than being inflated. Numbers are indicative buzz indices derived from evidence density — not a claim of exact search volume — and the BLR traffic figures are your Apr–Aug 2026 file.</P>
        </Section>

      </div>
    </>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
        <span className="tnum" style={{ fontSize: 13, color: "var(--muted-2)", fontWeight: 600 }}>{n}</span>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      <div className="card" style={{ padding: 20 }}>{children}</div>
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", margin: "10px 0 0" }}>{children}</p>;
}
function Callout({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(127,214,160,.07)", border: "1px solid rgba(127,214,160,.16)", fontSize: 13, lineHeight: 1.55 }}>{children}</div>;
}
function Eq({ label, eq, note }: { label: string; eq: string; note: string }) {
  return (
    <div style={{ marginTop: 12, padding: "13px 16px", borderRadius: 12, background: "linear-gradient(120deg, rgba(91,140,255,0.10), rgba(160,107,255,0.08))", border: "1px solid rgba(122,162,255,0.22)" }}>
      <div className="eyebrow" style={{ fontSize: 9.5, color: "#9db4ff" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 15, marginTop: 6, color: "#eaf0ff", letterSpacing: "0.01em" }}>{eq}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>{note}</div>
    </div>
  );
}
function Tier({ n, items }: { n: string; items: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>{n}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 }}>{items}</div>
    </div>
  );
}
function Traj({ c, name, d }: { c: string; name: string; d: string }) {
  return (
    <div style={{ padding: 11, borderRadius: 11, border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />{name}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{d}</div>
    </div>
  );
}
function RankTable({ title, rows }: { title: string; rows: typeof DOM }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, borderBottom: "1px solid var(--line)" }}>{title}</div>
      <table className="data">
        <thead><tr><th>City</th><th>Passengers</th><th>Flights</th><th>Load</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} style={{ background: r.pick ? "rgba(127,214,160,.06)" : undefined }}>
              <td style={{ fontWeight: r.pick ? 700 : 400 }}>{r.pick ? "✓ " : ""}{r.city}</td>
              <td className="tnum">{r.pax.toLocaleString("en-IN")}</td>
              <td className="tnum">{r.atm.toLocaleString("en-IN")}</td>
              <td className="tnum" style={{ color: r.slf >= 88 ? "var(--ok)" : r.slf < 80 ? "var(--warn)" : "var(--muted)" }}>{r.slf}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
