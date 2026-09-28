import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import Link from "next/link";
import { buildSixMonthReport } from "@/lib/intelligence/sixMonth";

export const dynamic = "force-dynamic";

const CODE: Record<string, string> = { del: "DEL", bom: "BOM", ccu: "CCU", dxb: "DXB", sin: "SIN", lhr: "LHR" };

export default async function CitiesPage() {
  const { opportunities } = await getPageData();
  const [cities, signals, portfolio, candidates] = await Promise.all([Repo.cities(), Repo.signals(), Repo.portfolio(), Repo.candidates()]);
  const report = buildSixMonthReport(cities, signals, portfolio, opportunities);

  return (
    <div className="cx-page">
      {/* Hero — same register as the globe console */}
      <section style={{ padding: "clamp(28px,6vh,64px) 0 32px" }}>
        <span className="cx-kicker" style={{ color: "#C6CDD7" }}>City intelligence — {cities.length} reference markets</span>
        <h1 className="cx-serif" style={{ fontSize: "clamp(42px,5.4vw,84px)", lineHeight: 0.95, margin: "18px 0 0", letterSpacing: "-.02em" }}>
          Where BLR&apos;s passengers come from,<br /><span style={{ fontStyle: "italic", color: "var(--gold)" }}>and what they&apos;re buying there.</span>
        </h1>
        <p style={{ maxWidth: 620, margin: "20px 0 0", fontSize: 15, lineHeight: 1.65, color: "#C6CDD7" }}>
          Markets are chosen by real BLR passenger traffic, not flight counts. Each card reads the last six months of evidence ({report.windowLabel}) and ties it to a move BIAL can make.
        </p>
      </section>

      <div className="cx-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,380px),1fr))" }}>
        {cities.map((c) => {
          const pulse = report.cityPulses.find((item) => item.city.id === c.id);
          const citySignals = pulse?.signals || [];
          const cityOpps = opportunities.filter((o) => o.city === c.name).sort((a, b) => b.score - a.score);
          const brands = new Set(citySignals.map((s) => s.brand).filter(Boolean)).size;
          const fnb = citySignals.filter((s) => s.category === "F&B").length;
          const retail = citySignals.filter((s) => s.category !== "F&B").length;
          const candCount = candidates.filter((cd) => cd.city === c.name).length;
          return (
            <article key={c.id} className="cx-cell" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "22px 22px 0", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span className="cx-kicker" style={{ color: c.kind === "domestic" ? "var(--cyan)" : "#FF7A45" }}>
                    {c.kind === "domestic" ? "Domestic feeder" : "International hub"} · {c.benchmarkAirport}
                  </span>
                  <span className="cx-mono" style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--gold)" }}>{CODE[c.id] || c.id.toUpperCase()}</span>
                </div>
                <h2 className="cx-serif" style={{ fontSize: 44, lineHeight: 1, margin: "14px 0 0" }}>{c.name}</h2>

                {c.connectivity && (
                  <div style={{ marginTop: 18, paddingLeft: 12, borderLeft: "2px solid var(--gold)" }}>
                    <div className="cx-kicker gold" style={{ fontSize: 9 }}>✈ BLR connectivity · {c.connectivity.rank}</div>
                    <div style={{ fontSize: 14, color: "var(--head)", marginTop: 6 }}>{c.connectivity.metric}</div>
                    {c.connectivity.detail && <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 3 }}>{c.connectivity.detail}</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                      {c.connectivity.sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="cx-link" style={{ fontSize: 9 }}>
                          {s.kind === "social" ? "◆ " : s.kind === "aviation-data" ? "✈ " : "↗ "}{s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 18 }}>
                  <div className="cx-kicker cyan" style={{ fontSize: 9 }}>Six-month signal</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text)", marginTop: 6 }}>{pulse?.focus || "No distinct recent signal yet."}</div>
                  {c.rationale && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>{c.rationale}</div>}
                </div>

                <div className="cx-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginTop: 18 }}>
                  {([[citySignals.length, "Signals"], [brands, "Brands"], [fnb, "F&B"], [retail, "Retail/DF"]] as const).map(([n, l]) => (
                    <div key={l} className="cx-cell" style={{ padding: "12px 10px" }}>
                      <div className="cx-kicker" style={{ fontSize: 8.5, letterSpacing: ".18em" }}>{l}</div>
                      <div className="cx-serif" style={{ fontSize: 30, lineHeight: 1.1 }}>{String(n).padStart(2, "0")}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, paddingBottom: 18 }}>
                  <div className="cx-kicker" style={{ fontSize: 9, marginBottom: 6 }}>BIAL opportunities · {cityOpps.length}</div>
                  {cityOpps.slice(0, 3).map((o) => (
                    <Link key={o.id} href={`/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: "1px solid var(--line)", textDecoration: "none" }}>
                      <span style={{ color: "var(--head)", fontSize: 14 }}>{o.brand}</span>
                      <span className="cx-serif" style={{ fontSize: 24, color: "var(--gold)" }}>{o.score}</span>
                    </Link>
                  ))}
                  {cityOpps.length === 0 && <div style={{ fontSize: 12.5, color: "var(--muted-2)" }}>Monitoring — no scored opportunity yet.</div>}
                </div>
              </div>
              <Link href={`/markets/${c.id}`} className="cx-cta">
                <span>{candCount > 0 ? `Explore ${candCount} buzzing brands` : "Market shortlist"}</span><span>→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
