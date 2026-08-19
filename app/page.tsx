import { getPageData } from "@/lib/view";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Ring3D } from "@/components/Ring3D";
import { IntelligenceGlobe, type GlobeCity } from "@/components/IntelligenceGlobe";
import { LiveCounter } from "@/components/LiveCounter";
import { MotionSection, MotionGrid, MotionItem } from "@/components/Motion";
import { Icon } from "@/components/Icon";
import { SixMonthLens } from "@/components/SixMonthLens";
import { TiltCard } from "@/components/TiltCard";
import { buildSixMonthReport } from "@/lib/intelligence/sixMonth";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CITY_COORDS: Record<string, [number, number]> = {
  Bangalore: [12.97, 77.59], "Delhi NCR": [28.61, 77.21], Mumbai: [19.08, 72.88],
  Hyderabad: [17.38, 78.49], Singapore: [1.35, 103.82], Dubai: [25.2, 55.27],
  London: [51.51, -0.13], Tokyo: [35.68, 139.69], Bangkok: [13.76, 100.5], "Hong Kong": [22.32, 114.17],
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function Dashboard() {
  const { config, opportunities } = await getPageData();
  const [signals, cities, portfolio] = await Promise.all([Repo.signals(), Repo.cities(), Repo.portfolio()]);
  const sixMonth = buildSixMonthReport(cities, signals, portfolio, opportunities);

  const immediate = opportunities.filter((o) => o.tier === "Immediate");
  const high = opportunities.filter((o) => o.tier === "High Potential");
  const highPriority = immediate.length + high.length;
  const emergingBrands = new Set(signals.map((s) => s.brand).filter(Boolean)).size;
  const sourcesMonitored = new Set(signals.map((s) => s.source)).size;
  const competitorAlerts = signals.filter((s) => s.signalType === "Competitive Movement").length;
  const newConcepts = signals.filter((s) => s.signalType === "Emerging Concept" || s.signalType === "Emerging Brand").length;
  const recentCut = Date.now() - 1000 * 60 * 60 * 24 * 14;
  const signalsRecent = signals.filter((s) => new Date(s.firstDetectedAt).getTime() >= recentCut).length;

  const recentSignals = [...signals].sort((a, b) => (b.firstDetectedAt < a.firstDetectedAt ? -1 : 1)).slice(0, 6);
  const ringItems = opportunities.filter((o) => o.image).map((o) => ({ id: o.id, brand: o.brand, vertical: o.vertical, score: o.score, image: o.image, city: o.city }));

  // Globe data — real signal counts per city
  const perCity = new Map<string, number>();
  signals.forEach((s) => perCity.set(s.city, (perCity.get(s.city) || 0) + 1));
  const globeCities: GlobeCity[] = Object.entries(CITY_COORDS).map(([name, [lat, lng]]) => ({
    name, lat, lng,
    signals: name === "Bangalore" ? opportunities.length : perCity.get(name) || 0,
  }));
  const events = recentSignals.map((s) => `${s.signalType} — ${s.city}${s.brand ? " · " + s.brand : ""}`);

  const status = [
    { icon: "globe", label: "Sources monitored", value: sourcesMonitored },
    { icon: "spark", label: "Signals (14d)", value: signalsRecent },
    { icon: "bag", label: "Emerging brands", value: emergingBrands },
    { icon: "trend", label: "New concepts", value: newConcepts },
    { icon: "pin", label: "High-priority opps", value: highPriority },
    { icon: "compass", label: "Competitor alerts", value: competitorAlerts },
  ];

  return (
    <>
      <Topbar title="BIAL Market Lens" subtitle="Six markets, six months of evidence, the next spaces BIAL can own." mode={config.mode} lastRefresh={config.lastRefreshAt} />

      {/* ── Cinematic hero ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "min(82vh, 780px)", minHeight: 560, overflow: "hidden", borderBottom: "1px solid var(--line)", background: "radial-gradient(70% 96% at 74% 50%, rgba(104,127,246,.14), transparent 66%), linear-gradient(130deg,rgba(16,18,29,.78),rgba(8,9,14,.54))" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 70% 30%, rgba(20,26,34,0) 40%, rgba(5,7,12,.58) 100%)" }} />
        <div style={{ position: "absolute", inset: 0 }}>
          <IntelligenceGlobe cities={globeCities} events={events} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(7,8,12,.96) 0%, rgba(8,10,16,.68) 43%, rgba(8,10,16,0) 69%)" }} />

        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 54px", maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <span className="live-dot" />
            <span className="eyebrow">Six-month evidence window · {sixMonth.windowLabel}</span>
          </div>
          <h1 style={{ fontSize: "clamp(42px, 5.2vw, 68px)", fontWeight: 650, letterSpacing: "-0.055em", lineHeight: 1.0, margin: 0 }}>
            See the shift.<br /><span className="grad-text">Own the gap.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, margin: "22px 0 0", maxWidth: 520 }}>
            A living view of market movement across BIAL&apos;s six reference cities, translated into commercially actionable white space.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
            <a href="#command" className="btn btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>View priority gaps <Icon name="arrow" size={15} color="#151927" /></a>
            <Link href="/trends" className="btn" style={{ padding: "12px 22px", fontSize: 14 }}>Explore evidence</Link>
          </div>
          <div style={{ marginTop: 44 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Live intelligence</div>
            <LiveCounter items={[
              { value: sixMonth.recentSignals.length, label: "Signals in window" },
              { value: sixMonth.cityPulses.length, label: "Markets tracked" },
              { value: sixMonth.gaps.length, label: "BIAL white spaces" },
              { value: opportunities.length, label: "Opportunities" },
              { value: highPriority, label: "Priority moves" },
            ]} />
          </div>
        </div>
      </section>

      {/* ── Command Centre ─────────────────────────────────────────────── */}
      <div id="command" style={{ padding: "40px 34px 48px", scrollMarginTop: 82 }}>
        <MotionSection>
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 10px" }}>
            {greeting()}, BIAL Commercial Team
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.5, maxWidth: 720, margin: 0 }}>
            The market lens has consolidated <strong style={{ color: "var(--text)" }}>{sixMonth.recentSignals.length} evidence-backed signals</strong> into{" "}
            <strong style={{ color: "var(--text)" }}>{sixMonth.gaps.length} portfolio gaps</strong> and {opportunities.filter((o) => o.sufficientEvidence).length} active opportunities.
          </p>
        </MotionSection>

        <MotionGrid style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12 }}>
          {status.map((t) => (
            <MotionItem key={t.label}>
              <div className="card" style={{ padding: 16, height: "100%" }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--text)" }}>
                  <Icon name={t.icon} size={15} />
                </span>
                <div className="tnum" style={{ fontSize: 30, fontWeight: 700, marginTop: 12, lineHeight: 1, letterSpacing: "-0.03em" }}>{t.value}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{t.label}</div>
              </div>
            </MotionItem>
          ))}
        </MotionGrid>

        <SixMonthLens cityPulses={sixMonth.cityPulses} gaps={sixMonth.gaps} windowLabel={sixMonth.windowLabel} />

        <MotionSection style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Opportunities BIAL Should Act On</h2>
            <Link href="/pipeline" style={{ fontSize: 13, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}>Full pipeline <Icon name="arrow" size={14} /></Link>
          </div>
          <MotionGrid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 18 }}>
            {opportunities.slice(0, 4).map((o) => (<MotionItem key={o.id}><TiltCard><OpportunityCard o={o} /></TiltCard></MotionItem>))}
          </MotionGrid>
        </MotionSection>

        <MotionSection style={{ marginTop: 44 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Opportunity gallery</div>
          <Ring3D items={ringItems} />
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>Drag to explore · click a card to open the opportunity</div>
        </MotionSection>

        <MotionSection style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Live Signal Feed</h2>
            <Link href="/signals" style={{ fontSize: 13, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}>Open feed <Icon name="arrow" size={14} /></Link>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data">
              <thead>
                <tr><th>Detected</th><th>City</th><th>Brand / Concept</th><th>Signal</th><th>Type</th><th>Confidence</th><th>Source</th></tr>
              </thead>
              <tbody>
                {recentSignals.map((s) => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(s.firstDetectedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                    <td>{s.city}</td>
                    <td style={{ fontWeight: 550 }}>{s.brand || s.subCategory}</td>
                    <td style={{ maxWidth: 320 }}>{s.trend}</td>
                    <td><span className="badge">{s.signalType}</span></td>
                    <td className="tnum">{s.confidence}%</td>
                    <td><a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{s.source} ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionSection>
      </div>
    </>
  );
}
