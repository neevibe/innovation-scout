import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";
import { buildSixMonthReport } from "@/lib/intelligence/sixMonth";

export const dynamic = "force-dynamic";

const FLAG: Record<string, string> = { India: "🇮🇳", UAE: "🇦🇪", Singapore: "🇸🇬", "United Kingdom": "🇬🇧" };

export default async function CitiesPage() {
  const { config, opportunities } = await getPageData();
  const [cities, signals, portfolio] = await Promise.all([Repo.cities(), Repo.signals(), Repo.portfolio()]);
  const report = buildSixMonthReport(cities, signals, portfolio, opportunities);

  return (
    <>
      <Topbar title="City Intelligence" subtitle={`Six reference markets · research window ${report.windowLabel}`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "24px 34px 48px" }}>
        <div className="card" style={{ padding: "14px 16px", marginBottom: 16, background: "linear-gradient(110deg,rgba(142,179,255,.13),rgba(146,112,255,.06))" }}>
          <span className="eyebrow" style={{ color: "#b9ceff" }}>Market reading protocol</span>
          <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 10 }}>Every card below prioritises evidence published in the last six months, then connects it to a BIAL-applicable move.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 14 }}>
        {cities.map((c) => {
          const pulse = report.cityPulses.find((item) => item.city.id === c.id);
          const citySignals = pulse?.signals || [];
          const cityOpps = opportunities.filter((o) => o.city === c.name);
          const brands = new Set(citySignals.map((s) => s.brand).filter(Boolean)).size;
          const fnb = citySignals.filter((s) => s.category === "F&B").length;
          const retail = citySignals.filter((s) => s.category !== "F&B").length;
          const topScore = cityOpps.length ? Math.max(...cityOpps.map((o) => o.score)) : 0;
          return (
            <div key={c.id} className="card lift-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 780 }}>{FLAG[c.country] || "🌐"} {c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.kind === "domestic" ? "Domestic feeder" : "International benchmark"} · {c.benchmarkAirport}</div>
                </div>
                <span className="badge">{c.active ? "● Active" : "Paused"}</span>
              </div>
              {c.connectivity && (
                <div style={{ marginTop: 12, padding: "10px 11px", borderRadius: 13, background: "rgba(127,214,160,.08)", border: "1px solid rgba(127,214,160,.14)" }}>
                  <div className="eyebrow" style={{ fontSize: 9, color: "#7fd6a0" }}>✈ BLR connectivity · {c.connectivity.rank}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 5 }}>{c.connectivity.metric}</div>
                  {c.connectivity.detail && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{c.connectivity.detail}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 7 }}>
                    {c.connectivity.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--accent)" }}>
                        {s.kind === "social" ? "◆ " : s.kind === "aviation-data" ? "✈ " : "↗ "}{s.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, padding: "10px 11px", borderRadius: 13, background: "rgba(160,187,255,.08)", border: "1px solid rgba(184,205,255,.10)" }}>
                <div className="eyebrow" style={{ fontSize: 9, color: "#b6caff" }}>Six-month signal</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: 4 }}>{pulse?.focus || "No distinct recent signal yet."}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>{c.rationale}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
                <Stat n={citySignals.length} l="signals" />
                <Stat n={brands} l="brands" />
                <Stat n={fnb} l="F&B" />
                <Stat n={retail} l="retail/DF" />
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>BIAL opportunities ({cityOpps.length}) · top score {topScore}</div>
                {cityOpps.slice(0, 3).map((o) => (
                  <Link key={o.id} href={`/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                    <span style={{ color: "var(--accent)" }}>{o.brand}</span>
                    <b>{o.score}</b>
                  </Link>
                ))}
                {cityOpps.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Monitoring — no scored opportunity yet.</div>}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div style={{ textAlign: "center", padding: 8, borderRadius: 9, background: "var(--surface-2)" }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{n}</div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{l}</div>
    </div>
  );
}
