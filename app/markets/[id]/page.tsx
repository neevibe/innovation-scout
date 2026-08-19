import { notFound } from "next/navigation";
import Link from "next/link";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { BuzzSpark } from "@/components/BuzzSpark";
import { DomainBadge } from "@/components/DomainBadge";
import { MotionGrid, MotionItem } from "@/components/Motion";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const FLAG: Record<string, string> = { India: "🇮🇳", UAE: "🇦🇪", Singapore: "🇸🇬", "United Kingdom": "🇬🇧" };

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cities, config] = await Promise.all([Repo.cities(), Repo.config()]);
  const city = cities.find((c) => c.id === id);
  if (!city) return notFound();
  const candidates = await Repo.candidatesForCity(city.name);

  return (
    <>
      <Topbar title={`${city.name} — Market Shortlist`} subtitle={`Every buzzing brand, scored + buzz-profiled · ${candidates.length} candidates`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "26px 34px 48px", maxWidth: 1000 }}>
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

        {candidates.length === 0 ? (
          <div className="card" style={{ padding: 24, marginTop: 16, color: "var(--muted)" }}>
            Shortlist not yet built for this market. Dubai is the first fully-worked market; run the live collector (or ask) to populate the rest.
          </div>
        ) : (
          <MotionGrid style={{ display: "grid", gap: 12, marginTop: 16 }}>
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
    </>
  );
}
