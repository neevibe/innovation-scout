import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { BuzzSpark } from "@/components/BuzzSpark";
import { DomainBadge } from "@/components/DomainBadge";
import { MotionGrid, MotionItem } from "@/components/Motion";
import { Icon } from "@/components/Icon";
import { getPageData } from "@/lib/view";
import { buildCitySectionBreakdown } from "@/lib/intelligence/citySections";
import { SECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

const FLAG: Record<string, string> = { India: "🇮🇳", UAE: "🇦🇪", Singapore: "🇸🇬", "United Kingdom": "🇬🇧" };

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
  const { config, opportunities } = await getPageData();
  const candidates = await Repo.candidatesForCity(city.name);
  const breakdown = buildCitySectionBreakdown(city, signals, await Repo.candidates(), opportunities, portfolio, dutyFreeSkus);

  return (
    <>
      <Topbar title={`${city.name} — Market Intelligence`} subtitle="Top 5 buzzing per section · scored against BIAL feasibility" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "26px 34px 48px", maxWidth: 1180 }}>
        <Link href="/cities" style={{ fontSize: 13, color: "var(--muted)" }}>← All cities</Link>

        {/* Header */}
        <div className="card" style={{ padding: 20, marginTop: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{FLAG[city.country] || "🌐"} {city.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>{city.kind === "domestic" ? "Domestic feeder" : "International hub"} · {city.benchmarkAirport}</div>
            {city.connectivity && <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 8 }}>✈ {city.connectivity.rank} — {city.connectivity.metric}</div>}
          </div>
          <Link href="/methodology" className="btn" style={{ height: "fit-content" }}>How these are scored <Icon name="arrow" size={13} /></Link>
        </div>

        {/* Six-section bucketed breakdown */}
        <div style={{ marginTop: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>What&rsquo;s buzzing, by section</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>
            Click any item: if it&rsquo;s already at BIAL you&rsquo;ll see why; if not, you get a generated business plan for bringing it in.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 14 }}>
            {SECTIONS.map((section) => {
              const items = breakdown.sections[section];
              return (
                <div key={section} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Icon name={SECTION_ICON[section] || "spark"} size={15} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{section}</span>
                    <span className="badge" style={{ marginLeft: "auto" }}>{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--muted)", padding: "10px 0" }}>No buzzing signal yet in this section — will populate on next live refresh.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {items.map((item, i) => {
                        const cardStyle: CSSProperties = {
                          display: "block", padding: "10px 11px", borderRadius: 10,
                          border: "1px solid var(--line)", textDecoration: "none", color: "inherit",
                        };
                        const inner = (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 650 }}>{String(i + 1).padStart(2, "0")} · {item.name}</span>
                              <span className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>{item.score}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                              {item.atBial ? (
                                <span className="badge" style={{ borderColor: "#a7e0b8", color: "var(--ok)", fontSize: 10 }}>✓ At BIAL</span>
                              ) : (
                                <span className="badge" style={{ borderColor: "#f0d28a", color: "var(--warn)", fontSize: 10 }}>Not at BIAL</span>
                              )}
                              <span style={{ fontSize: 10.5, color: "var(--muted-2)" }}>Feasibility {item.feasibility}/100</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.atBial ? item.bialNote : "Click for a business plan →"}
                            </div>
                          </>
                        );
                        return item.atBial ? (
                          <div key={item.id} style={cardStyle}>{inner}</div>
                        ) : (
                          <Link key={item.id} href={`/markets/${city.id}/plan/${item.id}?section=${encodeURIComponent(section)}`} className="lift-card" style={{ ...cardStyle, cursor: "pointer" }}>{inner}</Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing full market shortlist (buzz-profiled, deeper detail) */}
        <div style={{ marginTop: 30 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Full market shortlist</div>
          {candidates.length === 0 ? (
            <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
              Shortlist not yet built for this market. Dubai is the first fully-worked market; run the live collector (or ask) to populate the rest.
            </div>
          ) : (
            <MotionGrid style={{ display: "grid", gap: 12 }}>
              {candidates.map((c, i) => (
                <MotionItem key={c.id}>
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div className="tnum" style={{ fontSize: 22, fontWeight: 700, color: "var(--muted-2)", width: 34, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{c.brand}</span>
                          <DomainBadge vertical={c.vertical} />
                          <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{c.category}</span>
                          {c.airportPrecedent && <span className="badge" style={{ borderColor: "#7fd6a0", color: "var(--ok)" }}>✈ Airport precedent</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}><b style={{ color: "var(--text)" }}>Why:</b> {c.why}</div>
                        <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}><b style={{ color: "var(--accent)" }}>Bring to BIAL:</b> {c.bialFit}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 9, flexWrap: "wrap", fontSize: 11.5 }}>
                          {c.sources.map((s, j) => (
                            <a key={j} href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{s.tier === 4 ? "◆ " : "↗ "}{s.label} ↗</a>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                        <div className="tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>{c.score}<span style={{ fontSize: 11, color: "var(--muted-2)" }}>/100</span></div>
                        <BuzzSpark buzz={c.buzz} w={120} h={32} />
                      </div>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionGrid>
          )}
        </div>
      </div>
    </>
  );
}
