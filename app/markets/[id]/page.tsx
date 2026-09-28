import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Repo } from "@/lib/db/store";
import { BuzzSpark } from "@/components/BuzzSpark";
import { DomainBadge } from "@/components/DomainBadge";
import { MotionGrid, MotionItem } from "@/components/Motion";
import { Icon } from "@/components/Icon";
import { getPageData } from "@/lib/view";
import { buildCitySectionBreakdown } from "@/lib/intelligence/citySections";
import { SECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

const SECTION_ICON: Record<string, string> = {
  "Brands": "spark", "F&B": "bag", "Retail": "bag", "Duty Free": "bag",
  "Experiences": "compass", "Commercial Service": "gear",
};

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cities, signals, portfolio, dutyFreeSkus] = await Promise.all([
    Repo.cities(), Repo.signals(), Repo.portfolio(), Repo.dutyFreeSkus(),
  ]);
  const city = cities.find((c) => c.id === id);
  if (!city) return notFound();
  const { opportunities } = await getPageData();
  const candidates = await Repo.candidatesForCity(city.name);
  const breakdown = buildCitySectionBreakdown(city, signals, await Repo.candidates(), opportunities, portfolio, dutyFreeSkus);

  const code = ({ del: "DEL", bom: "BOM", ccu: "CCU", dxb: "DXB", sin: "SIN", lhr: "LHR" } as Record<string, string>)[city.id] || city.id.toUpperCase();

  return (
    <div className="cx-page">
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
        <a href="/" className="cx-link">← Globe</a>
        <Link href="/cities" className="cx-link" style={{ color: "var(--muted)" }}>All cities</Link>
      </div>

      {/* Hero */}
      <section style={{ padding: "clamp(24px,5vh,56px) 0 30px", display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 32, alignItems: "end" }} className="cx-hero">
        <div>
          <span className="cx-kicker" style={{ color: city.kind === "domestic" ? "var(--cyan)" : "#FF7A45" }}>
            {city.kind === "domestic" ? "Domestic feeder" : "International hub"} · {city.benchmarkAirport}
          </span>
          <h1 className="cx-serif" style={{ fontSize: "clamp(52px,7vw,112px)", lineHeight: 0.92, margin: "16px 0 0", letterSpacing: "-.025em" }}>
            {city.name}<span style={{ fontStyle: "italic", color: "var(--gold)" }}>.</span>
          </h1>
          <p style={{ maxWidth: 560, margin: "18px 0 0", fontSize: 15, lineHeight: 1.65, color: "#C6CDD7" }}>
            The top five buzzing items in each section, scored against BIAL feasibility. Anything not yet at BLR opens a generated business plan.
          </p>
        </div>
        <div className="cx-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="cx-cell" style={{ padding: "16px 14px" }}>
            <div className="cx-kicker" style={{ fontSize: 9 }}>Airport code</div>
            <div className="cx-serif" style={{ fontSize: 38, color: "var(--gold)" }}>{code}</div>
          </div>
          <div className="cx-cell" style={{ padding: "16px 14px" }}>
            <div className="cx-kicker" style={{ fontSize: 9 }}>Shortlist</div>
            <div className="cx-serif" style={{ fontSize: 38 }}>{String(candidates.length).padStart(2, "0")}</div>
          </div>
          {city.connectivity && (
            <div className="cx-cell" style={{ padding: "14px", gridColumn: "1 / -1" }}>
              <div className="cx-kicker gold" style={{ fontSize: 9 }}>✈ {city.connectivity.rank}</div>
              <div style={{ fontSize: 13.5, color: "var(--head)", marginTop: 6 }}>{city.connectivity.metric}</div>
            </div>
          )}
          <Link href="/methodology" className="cx-cta" style={{ gridColumn: "1 / -1", background: "#070A10" }}><span>How these are scored</span><span>→</span></Link>
        </div>
      </section>

      {/* Six-section bucketed breakdown */}
      <section style={{ paddingTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <span className="cx-kicker"><span style={{ color: "var(--gold)", marginRight: 12 }}>01</span>What&rsquo;s buzzing, by section</span>
            <h2 className="cx-serif" style={{ fontSize: "clamp(30px,3.4vw,46px)", lineHeight: 1, margin: "12px 0 0" }}>Five per section, <span style={{ fontStyle: "italic", color: "var(--gold)" }}>scored for BLR</span></h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="cx-pill" style={{ color: "var(--ok)", borderColor: "rgba(111,227,168,.4)" }}>✓ At BIAL</span>
            <span className="cx-pill" style={{ color: "var(--gold)", borderColor: "rgba(240,180,41,.45)" }}>Not at BIAL → plan</span>
          </div>
        </div>
        <div className="cx-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,360px),1fr))" }}>
          {SECTIONS.map((section) => {
            const items = breakdown.sections[section];
            return (
              <div key={section} className="cx-cell" style={{ padding: "18px 18px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Icon name={SECTION_ICON[section] || "spark"} size={14} color="var(--gold)" />
                  <span className="cx-kicker" style={{ color: "var(--head)" }}>{section}</span>
                  <span className="cx-mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted-2)" }}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--muted-2)", padding: "10px 0 12px" }}>No buzzing signal yet in this section — will populate on the next live refresh.</div>
                ) : (
                  <div>
                    {items.map((item, i) => {
                      const cardStyle: CSSProperties = { display: "block", padding: "12px 0", borderTop: "1px solid var(--line)", textDecoration: "none", color: "inherit" };
                      const inner = (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                            <span style={{ fontSize: 14.5, color: "var(--head)" }}><span className="cx-mono" style={{ fontSize: 10, color: "var(--muted-2)", marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>{item.name}</span>
                            <span className="cx-serif" style={{ fontSize: 26, lineHeight: 1, color: "var(--gold)" }}>{item.score}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                            {item.atBial ? (
                              <span className="cx-pill" style={{ color: "var(--ok)", borderColor: "rgba(111,227,168,.4)" }}>✓ At BIAL</span>
                            ) : (
                              <span className="cx-pill" style={{ color: "var(--gold)", borderColor: "rgba(240,180,41,.45)" }}>Not at BIAL</span>
                            )}
                            <span className="cx-mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "var(--muted-2)" }}>FEASIBILITY {item.feasibility}/100</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.atBial ? item.bialNote : <span className="cx-link">Open business plan →</span>}
                          </div>
                        </>
                      );
                      return item.atBial ? (
                        <div key={item.id} style={cardStyle}>{inner}</div>
                      ) : (
                        <Link key={item.id} href={`/markets/${city.id}/plan/${item.id}?section=${encodeURIComponent(section)}`} className="cx-row" style={{ ...cardStyle, cursor: "pointer" }}>{inner}</Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Full market shortlist (buzz-profiled) */}
      <section style={{ paddingTop: 64 }}>
        <span className="cx-kicker"><span style={{ color: "var(--gold)", marginRight: 12 }}>02</span>Full market shortlist</span>
        <h2 className="cx-serif" style={{ fontSize: "clamp(30px,3.4vw,46px)", lineHeight: 1, margin: "12px 0 20px" }}>Every buzzing brand, <span style={{ fontStyle: "italic", color: "var(--gold)" }}>ranked</span></h2>
        {candidates.length === 0 ? (
          <div className="cx-note">Shortlist not yet built for this market. Run the live collector to populate it.</div>
        ) : (
          <MotionGrid className="cx-grid" style={{ gridTemplateColumns: "1fr" }}>
            {candidates.map((c, i) => (
              <MotionItem key={c.id}>
                <div className="cx-cell cx-shortrow">
                  <div className="cx-mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="cx-serif" style={{ fontSize: 28, lineHeight: 1 }}>{c.brand}</span>
                      <DomainBadge vertical={c.vertical} />
                      {c.airportPrecedent && <span className="cx-pill" style={{ color: "var(--ok)", borderColor: "rgba(111,227,168,.4)" }}>✈ Airport precedent</span>}
                    </div>
                    <div className="cx-mono" style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted-2)", marginTop: 6 }}>{c.category}</div>
                    <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}><span style={{ color: "var(--head)" }}>Why · </span>{c.why}</div>
                    <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55, color: "var(--text)" }}><span style={{ color: "var(--gold)" }}>Bring to BIAL · </span>{c.bialFit}</div>
                    <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                      {c.sources.map((s, j) => (
                        <a key={j} href={s.url} target="_blank" rel="noreferrer" className="cx-link" style={{ fontSize: 9 }}>{s.tier === 4 ? "◆ " : "↗ "}{s.label}</a>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div className="cx-serif" style={{ fontSize: 44, lineHeight: 1, color: "var(--gold)" }}>{c.score}</div>
                    <BuzzSpark buzz={c.buzz} w={120} h={32} />
                  </div>
                </div>
              </MotionItem>
            ))}
          </MotionGrid>
        )}
      </section>
    </div>
  );
}
