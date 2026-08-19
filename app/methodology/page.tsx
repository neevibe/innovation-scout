import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { BuzzSpark } from "@/components/BuzzSpark";
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
        </Section>

        {/* Market model */}
        <Section n="02" title="Market Selection Model — why these six cities">
          <P><b>Input:</b> BIAL traffic data (Apr–Aug 2026), arrivals + departures per sector — <span className="kbd">ATM</span> (flights), <span className="kbd">Pax</span> (passengers), <span className="kbd">SLF</span> (seat load factor).</P>
          <P><b>Primary metric = Passengers, not flights.</b> This is a <i>retail</i> system: the addressable audience at BIAL is people, not aircraft. Raw flight count over-weights short-haul, high-frequency, small-aircraft routes. <b>SLF</b> is the tie-breaker (how full = how real the demand). Flights are tertiary (access/frequency).</P>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
            <RankTable title="Domestic (from BLR)" rows={DOM} />
            <RankTable title="International (from BLR)" rows={INT} />
          </div>
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
          <Callout>
            Promotion rule: a signal becomes a scored opportunity only if <b>persistence ≥ 0.5</b> <i>or</i> the trajectory is clearly <b>Accelerating/Emerging</b>. <b>Spike-and-fade</b> items (e.g. a time-boxed pop-up) are labelled and excluded from durable-trend treatment — you import the <i>format</i>, not the fleeting name.
          </Callout>
        </Section>

        {/* Scoring model */}
        <Section n="05" title="Opportunity Scoring Model — 9 weighted factors, 0–100">
          <P>Qualified opportunities are scored on nine factors with admin-configurable weights (buzz persistence feeds <i>Market Momentum</i> and <i>Evidence Confidence</i>). Tiers: ≥{cfg.thresholds.immediate} Immediate · ≥{cfg.thresholds.highPotential} High · ≥{cfg.thresholds.monitor} Monitor.</P>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8, marginTop: 8 }}>
            {(Object.keys(w) as FactorKey[]).map((k) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)", fontSize: 12.5 }}>
                <span>{FACTOR_LABELS[k]}</span><b>{w[k].toFixed(0)}%</b>
              </div>
            ))}
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
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{o.brand} <span style={{ fontSize: 11, color: "var(--muted-2)" }}>· {o.city} · {o.vertical}</span></div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{o.buzz?.note}</div>
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
