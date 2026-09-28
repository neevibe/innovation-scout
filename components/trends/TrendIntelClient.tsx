"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GeoId, Lifecycle, PlatformId, PlatformStatus, TrendCategory, TrendRecord, TrendSnapshot, Verdict } from "@/lib/trends/types";

// ---------------------------------------------------------------------------
// Trend Intelligence — visual language matches the live Innovation Scout
// console (public/prototype): #04060A field, hairline panels, gold signal
// colour, Instrument Serif display, JetBrains Mono telemetry labels.
// ---------------------------------------------------------------------------

const C = {
  bg: "#04060A", panel: "#070A10", panel2: "#0A0E16", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.14)",
  ink: "#EDE9E1", head: "#F4F0E8", soft: "#C6CDD7", body: "#98A2B1", mute: "#6E7A8A", dim: "#5C6675",
  gold: "#F0B429", goldHi: "#FFD87A", orange: "#FF7A45", cyan: "#7FD4FF", green: "#6FE3A8", red: "#FF6B6B",
};
const MONO = "var(--ti-mono), 'JetBrains Mono', ui-monospace, monospace";
const SERIF = "var(--ti-serif), 'Instrument Serif', Georgia, serif";
const SANS = "var(--ti-sans), 'Instrument Sans', system-ui, sans-serif";

const PLATFORM_ORDER: PlatformId[] = ["instagram", "x", "facebook", "search", "youtube", "reddit", "news"];
const PLATFORM_SHORT: Record<PlatformId, string> = { instagram: "Instagram", x: "X", facebook: "Facebook", search: "Search", youtube: "YouTube", reddit: "Reddit", news: "News/Web" };
const GEOS: { id: GeoId; label: string; note: string }[] = [
  { id: "global", label: "Global", note: "All news coverage, 7 days" },
  { id: "asia", label: "Asia", note: "Coverage naming Asian markets, 7 days" },
  { id: "india", label: "India", note: "Coverage naming Indian cities, 7 days" },
  { id: "bengaluru", label: "Bengaluru", note: "Coverage naming Bengaluru, 90 days" },
];
const LIFECYCLE: Lifecycle[] = ["Emerging", "Accelerating", "Peak", "Cooling", "Declining"];
const LIFE_COLOR: Record<Lifecycle, string> = { Emerging: C.cyan, Accelerating: C.green, Peak: C.gold, Cooling: C.orange, Declining: C.red };
const VERDICT_COLOR: Record<Verdict, string> = { "Act now": C.gold, Pilot: C.green, Watch: C.cyan, "Low relevance": C.dim };
const CATEGORIES: TrendCategory[] = ["Beauty", "F&B", "Fashion", "Travel", "Retail", "Technology", "Wellness", "Culture"];

type SortKey = "overall" | "velocity" | "blr";

function level(i: number): { label: string; tone: string } {
  if (i >= 85) return { label: "Very High", tone: C.gold };
  if (i >= 65) return { label: "High", tone: C.goldHi };
  if (i >= 45) return { label: "Medium", tone: C.soft };
  if (i >= 25) return { label: "Low", tone: C.mute };
  return { label: "Minimal", tone: C.dim };
}
const isHot = (i: number | null, v: number | null) => i != null && i >= 80 && (v ?? 0) >= 1.15;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
}

// --- atoms ------------------------------------------------------------------
const Kicker = ({ children, color = C.gold }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".3em", color, textTransform: "uppercase" }}>{children}</span>
);

function Pill({ children, color, solid = false }: { children: React.ReactNode; color: string; solid?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", padding: "4px 8px", border: `1px solid ${color}55`, color: solid ? C.bg : color, background: solid ? color : `${color}12`, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Spark({ series, w = 120, h = 28, color = C.gold, fluid = false }: { series: number[]; w?: number; h?: number; color?: string; fluid?: boolean }) {
  if (!series || series.length < 2) return <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: ".14em" }}>NO SERIES</span>;
  // 7-day smoothing so daily noise doesn't read as a trend.
  const sm = series.map((_, i) => { const s = series.slice(Math.max(0, i - 6), i + 1); return s.reduce((a, b) => a + b, 0) / s.length; });
  const min = Math.min(...sm), max = Math.max(...sm);
  const pts = sm.map((v, i) => `${(i / (sm.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(" ");
  const id = `g${Math.round(sm[0] * 1000) % 99999}${sm.length}`;
  return (
    <svg width={fluid ? "100%" : w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={fluid ? "none" : undefined} aria-hidden style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function VelocityBar({ score }: { score: number }) {
  const off = Math.max(-50, Math.min(50, score - 50));
  const up = off >= 0;
  return (
    <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,.05)", width: "100%" }}>
      <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 1, background: C.line2 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: up ? "50%" : `${50 + off}%`, width: `${Math.abs(off)}%`, background: up ? `linear-gradient(90deg, ${C.gold}66, ${C.gold})` : `linear-gradient(90deg, ${C.orange}, ${C.orange}55)` }} />
    </div>
  );
}

function SectionHead({ num, kicker, title, sub }: { num: string; kicker: string; title: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 22 }}>
      <div>
        <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.gold, letterSpacing: ".18em" }}>{num}</span>
          <Kicker color={C.mute}>{kicker}</Kicker>
        </div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(30px,3.4vw,46px)", lineHeight: 1, margin: "12px 0 0", color: C.head, letterSpacing: "-.01em" }}>{title}</h2>
      </div>
      {sub && <p style={{ maxWidth: 440, margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.body }}>{sub}</p>}
    </div>
  );
}

const Panel = ({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <div className={className} style={{ background: `linear-gradient(180deg, rgba(7,10,16,.92), rgba(7,10,16,.7))`, border: `1px solid ${C.line}`, ...style }}>{children}</div>
);

// --- main ------------------------------------------------------------------
export function TrendIntelClient({ snap }: { snap: TrendSnapshot }) {
  const [geo, setGeo] = useState<"all" | GeoId>("all");
  const [cat, setCat] = useState<"All" | TrendCategory>("All");
  const [life, setLife] = useState<"All" | Lifecycle>("All");
  const [sort, setSort] = useState<SortKey>("overall");
  const [open, setOpen] = useState<TrendRecord | null>(null);
  const [nowGeo, setNowGeo] = useState("IN");
  const [commercialOnly, setCommercialOnly] = useState(true);

  const status = useMemo(() => Object.fromEntries(snap.platforms.map((p) => [p.id, p])) as Record<PlatformId, PlatformStatus>, [snap.platforms]);
  const connected = snap.platforms.filter((p) => p.mode !== "disconnected");

  const rank = (t: TrendRecord) => (geo === "all" ? t.overall : Math.round(0.6 * t.overall + 0.4 * (t.geo[geo] ?? 0)));
  const sortVal = (t: TrendRecord) => (sort === "overall" ? rank(t) : sort === "velocity" ? t.velocityScore : t.blrRelevance);

  const filtered = useMemo(
    () => snap.trends.filter((t) => (cat === "All" || t.category === cat) && (life === "All" || t.lifecycle === life)).sort((a, b) => sortVal(b) - sortVal(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap.trends, cat, life, sort, geo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byVelocity = [...filtered].sort((a, b) => b.velocityScore - a.velocityScore);
  const emerging = [...snap.trends].filter((t) => t.lifecycle === "Emerging" || (t.momentum < 58 && t.velocityScore >= 56)).sort((a, b) => b.velocityScore - a.velocityScore).slice(0, 4);
  const cross = filtered.filter((t) => t.spread === "cross-platform");
  const specific = filtered.filter((t) => t.spread === "platform-specific");
  const blrRanked = [...filtered].sort((a, b) => b.blrRelevance - a.blrRelevance);
  const accelerating = snap.trends.filter((t) => t.lifecycle === "Accelerating" || t.lifecycle === "Emerging").length;
  const actNow = snap.trends.filter((t) => t.verdict === "Act now").length;
  const geoLabel = geo === "all" ? "" : ` · ${GEOS.find((g) => g.id === geo)?.label}`;

  return (
    <div className="ti-root" style={{ position: "relative", overflowX: "clip", color: C.ink, fontFamily: SANS }}>
      <style>{CSS}</style>
      <main style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "0 clamp(16px,3vw,40px) 120px" }}>
        {/* Hero */}
        <section style={{ padding: "clamp(56px,9vh,96px) 0 40px", display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: 40, alignItems: "end" }} className="ti-stack">
          <div className="ti-rise">
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}><Kicker color={C.soft}>Trend Intelligence — Signal Layer</Kicker><a href="#sources" className="ti-live"><span className="ti-blink" />{connected.length}/{snap.platforms.length} sources live · sweep {fmtDate(snap.generatedAt)}</a></div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(42px,5.6vw,88px)", lineHeight: .95, letterSpacing: "-.02em", margin: "20px 0 0", color: C.head }}>
              What&apos;s trending, where,<br />how fast — <span style={{ fontStyle: "italic", color: C.gold }}>and does it matter for BLR?</span>
            </h1>
            <p style={{ maxWidth: 580, margin: "22px 0 0", fontSize: 15, lineHeight: 1.65, color: C.soft }}>
              One read across social, search, video and news, measured the same way on every platform. Each trend is scored for strength and speed, placed on its lifecycle, then translated into what it could mean at Kempegowda International.
            </p>
          </div>
          <div className="ti-kpis ti-rise" style={{ animationDelay: ".12s" }}>
            {[
              ["TRENDS TRACKED", String(snap.trends.length), C.head],
              ["ACCELERATING", String(accelerating).padStart(2, "0"), C.green],
              ["ACT NOW FOR BLR", String(actNow).padStart(2, "0"), C.gold],
              ["PLATFORMS LIVE", `${connected.length}/${snap.platforms.length}`, C.orange],
            ].map(([k, v, c]) => (
              <div key={k} style={{ background: C.panel, padding: "18px 16px" }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", color: C.mute }}>{k}</div>
                <div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.05, color: c, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter bar */}
        <div className="ti-filters">
          <FilterGroup label="GEOGRAPHY" value={geo} onChange={(v) => setGeo(v as typeof geo)} options={[["all", "All"], ...GEOS.map((g) => [g.id, g.label] as [string, string])]} />
          <FilterGroup label="CATEGORY" value={cat} onChange={(v) => setCat(v as typeof cat)} options={[["All", "All"], ...CATEGORIES.map((c) => [c, c] as [string, string])]} />
          <FilterGroup label="LIFECYCLE" value={life} onChange={(v) => setLife(v as typeof life)} options={[["All", "All"], ...LIFECYCLE.map((l) => [l, l] as [string, string])]} />
          <FilterGroup label="SORT" value={sort} onChange={(v) => setSort(v as SortKey)} options={[["overall", "Overall"], ["velocity", "Velocity"], ["blr", "BLR relevance"]]} />
        </div>

        {/* 01 — Trending now */}
        <section id="now" className="ti-section">
          <SectionHead num="01" kicker="What's trending now" title={<>The board, <span style={{ fontStyle: "italic", color: C.gold }}>right now</span></>} sub={`Top tracked trends by ${sort === "overall" ? `overall score${geoLabel}` : sort === "velocity" ? "velocity" : "BLR relevance"}, beside Google's raw 'Trending now' searches for each market.`} />
          <div className="ti-two" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
              {filtered.slice(0, 6).map((t, i) => (
                <button key={t.id} onClick={() => setOpen(t)} className="ti-card" style={{ textAlign: "left", background: C.panel, border: "none", padding: "20px 18px", cursor: "pointer", color: "inherit", fontFamily: SANS }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: ".16em" }}>{String(i + 1).padStart(2, "0")} · {t.category.toUpperCase()}</span>
                    <Pill color={LIFE_COLOR[t.lifecycle]}>{t.lifecycle}</Pill>
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.05, color: C.head, marginTop: 14 }}>{t.name}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 16, gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", color: C.mute }}>{sort === "blr" ? "BLR RELEVANCE" : sort === "velocity" ? "VELOCITY" : `OVERALL${geoLabel.toUpperCase()}`}</div>
                      <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1, color: C.gold }}>{sortVal(t)}</div>
                    </div>
                    <Spark series={t.series.slice(-60)} w={96} h={30} />
                  </div>
                  <div style={{ display: "flex", gap: 3, marginTop: 14 }}>
                    {PLATFORM_ORDER.map((p) => {
                      const r = t.platforms[p];
                      return <div key={p} title={`${PLATFORM_SHORT[p]}: ${r.intensity ?? "not measured"}`} style={{ flex: 1, height: 4, background: r.intensity == null ? "rgba(255,255,255,.05)" : `rgba(240,180,41,${0.18 + (r.intensity / 100) * 0.82})` }} />;
                    })}
                  </div>
                </button>
              ))}
            </div>
            <Panel style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 360 }}>
              <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Kicker color={C.cyan}>Google · Trending now</Kicker>
                  <label style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: C.mute, cursor: "pointer" }}>
                    <input type="checkbox" checked={commercialOnly} onChange={(e) => setCommercialOnly(e.target.checked)} style={{ accentColor: C.gold }} /> COMMERCIAL ONLY
                  </label>
                </div>
                <div style={{ display: "flex", gap: 2, marginTop: 12 }}>
                  {["IN", "SG", "AE", "GB"].map((g) => (
                    <button key={g} onClick={() => setNowGeo(g)} className={`ti-chip ${nowGeo === g ? "on" : ""}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 420 }}>
                {(() => {
                  const rows = snap.trendingNow.filter((n) => n.geo === nowGeo && (!commercialOnly || n.commercial));
                  if (!rows.length) return <div style={{ padding: 18, fontSize: 13, color: C.mute }}>No commercial searches in this market&apos;s live feed right now. Untick <em>commercial only</em> to see everything.</div>;
                  return rows.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noreferrer" className="ti-row" style={{ display: "block", padding: "12px 18px", borderBottom: `1px solid ${C.line}`, textDecoration: "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ color: C.head, fontSize: 14.5 }}>{n.title}</span>
                        {n.traffic && <span style={{ fontFamily: MONO, fontSize: 10, color: C.gold, whiteSpace: "nowrap" }}>{n.traffic}</span>}
                      </div>
                      {n.news && <div style={{ fontSize: 12, color: C.mute, marginTop: 4, lineHeight: 1.45 }}>{n.news}</div>}
                    </a>
                  ));
                })()}
              </div>
              <div style={{ padding: "10px 18px", fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: C.dim, borderTop: `1px solid ${C.line}` }}>LIVE DAILY SEARCHES · COMMERCIAL TAG IS A KEYWORD HEURISTIC</div>
            </Panel>
          </div>
        </section>

        {/* 02/03 — Platform comparison matrix */}
        <section id="matrix" className="ti-section">
          <SectionHead num="02" kicker="Platform comparison" title={<>Where each trend is <span style={{ fontStyle: "italic", color: C.gold }}>strongest</span></>} sub="Intensity per platform is ranked against every other tracked trend on that platform. 🔥 marks top-tier intensity that is still accelerating. Hatched cells are platforms we haven't connected yet; they are left blank rather than estimated." />
          <Panel style={{ padding: 0 }}>
            <div className="ti-scroll-x">
              <table className="ti-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", minWidth: 210 }}>Trend</th>
                    {PLATFORM_ORDER.map((p) => (
                      <th key={p} title={status[p]?.sourceLabel}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: status[p]?.mode === "live" ? C.green : status[p]?.mode === "proxy" ? C.cyan : "#3A4452" }} />
                          {PLATFORM_SHORT[p]}{status[p]?.mode === "proxy" ? "*" : ""}
                        </span>
                      </th>
                    ))}
                    <th>Velocity</th>
                    <th>Lifecycle</th>
                    <th>Overall{geoLabel}</th>
                    <th>BLR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} onClick={() => setOpen(t)} className="ti-tr">
                      <td style={{ textAlign: "left" }}>
                        <div style={{ color: C.head, fontSize: 14.5 }}>{t.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: C.dim, marginTop: 3 }}>{t.category.toUpperCase()} · {t.spread.toUpperCase()}</div>
                      </td>
                      {PLATFORM_ORDER.map((p) => <MatrixCell key={p} t={t} p={p} st={status[p]} />)}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                          <span style={{ color: t.velocityScore >= 62 ? C.green : t.velocityScore < 42 ? C.orange : C.soft, fontFamily: MONO, fontSize: 12 }}>{t.velocityScore >= 56 ? "▲" : t.velocityScore <= 44 ? "▼" : "▬"} {t.velocityScore}</span>
                        </div>
                      </td>
                      <td><Pill color={LIFE_COLOR[t.lifecycle]}>{t.lifecycle}</Pill></td>
                      <td><span style={{ fontFamily: SERIF, fontSize: 26, color: C.gold }}>{rank(t)}</span></td>
                      <td><span style={{ fontFamily: MONO, fontSize: 12, color: VERDICT_COLOR[t.verdict] }}>{t.blrRelevance}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.line}`, display: "flex", flexWrap: "wrap", gap: 18, fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: C.mute }}>
              <span><span style={{ color: C.green }}>●</span> LIVE</span>
              <span><span style={{ color: C.cyan }}>●</span> PROXY (*SEARCH = WIKIPEDIA PAGEVIEWS)</span>
              <span><span style={{ color: "#3A4452" }}>●</span> NOT CONNECTED</span>
              <span>LEVELS: VERY HIGH ≥85 · HIGH ≥65 · MEDIUM ≥45 · LOW ≥25</span>
              <span>CLICK A ROW FOR THE FULL READ</span>
            </div>
          </Panel>
        </section>

        {/* 03 — Velocity */}
        <section id="velocity" className="ti-section">
          <SectionHead num="03" kicker="Trend velocity" title={<>How fast it&apos;s <span style={{ fontStyle: "italic", color: C.gold }}>moving</span></>} sub="50 = flat. Above 62 is accelerating, below 42 is losing pace. Blends the last 7 days of search interest against the prior 28, week-vs-month YouTube views, and today's news against this week's." />
          <Panel style={{ padding: "6px 0" }}>
            {byVelocity.map((t) => (
              <button key={t.id} onClick={() => setOpen(t)} className="ti-vrow">
                <span style={{ color: C.head, fontSize: 14 }}>{t.name}</span>
                <VelocityBar score={t.velocityScore} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: t.velocityScore >= 62 ? C.green : t.velocityScore < 42 ? C.orange : C.soft, textAlign: "right" }}>{t.velocityScore}</span>
                <span className="ti-hide-sm"><Spark series={t.series.slice(-60)} w={110} h={22} color={LIFE_COLOR[t.lifecycle]} /></span>
                <span className="ti-hide-sm" style={{ textAlign: "right" }}><Pill color={LIFE_COLOR[t.lifecycle]}>{t.lifecycle}</Pill></span>
              </button>
            ))}
          </Panel>
        </section>

        {/* 04 — Emerging */}
        <section id="emerging" className="ti-section">
          <SectionHead num="04" kicker="Emerging trends" title={<>Small today, <span style={{ fontStyle: "italic", color: C.gold }}>accelerating</span></>} sub="Below-median reach but gaining speed. These are the early calls: cheap to pilot now, expensive to chase later." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {emerging.length ? emerging.map((t) => (
              <Panel key={t.id} style={{ padding: 22, borderColor: "rgba(127,212,255,.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><Kicker color={C.cyan}>{t.category}</Kicker><Pill color={LIFE_COLOR[t.lifecycle]}>{t.lifecycle}</Pill></div>
                <div style={{ fontFamily: SERIF, fontSize: 32, color: C.head, marginTop: 12, lineHeight: 1 }}>{t.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.line, marginTop: 18 }}>
                  <div style={{ background: C.panel, padding: 12 }}><div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".18em", color: C.mute }}>REACH</div><div style={{ fontFamily: SERIF, fontSize: 28, color: C.soft }}>{t.momentum}</div></div>
                  <div style={{ background: C.panel, padding: 12 }}><div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".18em", color: C.mute }}>VELOCITY</div><div style={{ fontFamily: SERIF, fontSize: 28, color: C.green }}>{t.velocityScore}</div></div>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: C.body, margin: "14px 0 0" }}>{t.blr.play}</p>
                <button onClick={() => setOpen(t)} className="ti-link" style={{ marginTop: 12 }}>OPEN FULL READ →</button>
              </Panel>
            )) : <Panel style={{ padding: 22, color: C.mute }}>No trend currently meets the emerging rule (below-median reach and velocity ≥ 56).</Panel>}
          </div>
        </section>

        {/* 05/06 — Cross-platform vs platform-specific */}
        <section id="spread" className="ti-section">
          <SectionHead num="05 · 06" kicker="Cross-platform vs platform-specific" title={<>Everywhere, or <span style={{ fontStyle: "italic", color: C.gold }}>one place only?</span></>} sub="Cross-platform = Medium or stronger on three or more measured platforms. Platform-specific = one platform leads by 20+ points, which usually means a subculture or a news spike rather than broad demand." />
          <div className="ti-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <SpreadList title="Cross-platform" color={C.gold} items={cross} empty="No trend is strong on 3+ measured platforms under the current filters." onOpen={setOpen} />
            <SpreadList title="Platform-specific" color={C.cyan} items={specific} empty="No trend is isolated to a single platform under the current filters." onOpen={setOpen} showDominant />
          </div>
        </section>

        {/* 07 — Lifecycle */}
        <section id="lifecycle" className="ti-section">
          <SectionHead num="07" kicker="Trend lifecycle" title={<>Emerging → Accelerating → Peak → <span style={{ fontStyle: "italic", color: C.gold }}>Cooling → Declining</span></>} sub="Stage comes from velocity and reach, with a check against the 90-day search curve: a trend now below 60% of its recent high is called Cooling even if this week is flat." />
          <div className="ti-life">
            {LIFECYCLE.map((stage, si) => {
              const items = filtered.filter((t) => t.lifecycle === stage);
              return (
                <div key={stage} style={{ background: C.panel, padding: "16px 14px", minHeight: 200, borderTop: `2px solid ${LIFE_COLOR[stage]}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", color: LIFE_COLOR[stage] }}>0{si + 1} {stage.toUpperCase()}</span>
                    <span style={{ fontFamily: SERIF, fontSize: 26, color: C.head }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                    {items.map((t) => (
                      <button key={t.id} onClick={() => setOpen(t)} className="ti-lchip" style={{ borderLeft: `2px solid ${LIFE_COLOR[stage]}` }}>
                        <span>{t.name}</span><span style={{ fontFamily: MONO, fontSize: 10, color: C.mute }}>{rank(t)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 08 — Geography */}
        <section id="geo" className="ti-section">
          <SectionHead num="08" kicker="Geography" title={<>Global, Asia, India — <span style={{ fontStyle: "italic", color: C.gold }}>Bengaluru</span></>} sub="Where the coverage is concentrated, measured as news coverage that names each place (7 days; 90 days for Bengaluru, where coverage is thinner). Pick a geography above to re-rank the whole page." />
          <Panel style={{ padding: 0 }}>
            <div className="ti-scroll-x">
              <table className="ti-table">
                <thead><tr><th style={{ textAlign: "left", minWidth: 200 }}>Trend</th>{GEOS.map((g) => <th key={g.id} title={g.note} style={{ color: geo === g.id ? C.gold : undefined }}>{g.label}</th>)}<th style={{ textAlign: "left" }}>Read</th></tr></thead>
                <tbody>
                  {filtered.map((t) => {
                    const home = t.geo.bengaluru ?? 0, glob = t.geo.global ?? 0;
                    const read = home - glob >= 15 ? "Over-indexes in Bengaluru" : (t.geo.india ?? 0) - glob >= 15 ? "India-led" : glob - (t.geo.india ?? 0) >= 20 ? "Global, not yet in India" : "Broad";
                    return (
                      <tr key={t.id} onClick={() => setOpen(t)} className="ti-tr">
                        <td style={{ textAlign: "left", color: C.head }}>{t.name}</td>
                        {GEOS.map((g) => {
                          const v = t.geo[g.id];
                          return <td key={g.id}><div className="ti-heat" style={{ background: v == null ? "transparent" : `rgba(240,180,41,${0.05 + (v / 100) * 0.55})`, color: v != null && v >= 70 ? C.bg : C.soft }}>{v ?? "—"}</div></td>;
                        })}
                        <td style={{ textAlign: "left", fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: read.startsWith("Global") ? C.cyan : read === "Broad" ? C.mute : C.gold }}>{read.toUpperCase()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        {/* 09 — Category */}
        <section id="category" className="ti-section">
          <SectionHead num="09" kicker="Category" title={<>Which categories are <span style={{ fontStyle: "italic", color: C.gold }}>running hot</span></>} sub="Average overall score and velocity by category, with the category leader. Click a tile to filter the page." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {CATEGORIES.map((c) => {
              const ts = snap.trends.filter((t) => t.category === c);
              if (!ts.length) return null;
              const avg = Math.round(ts.reduce((s, t) => s + t.overall, 0) / ts.length);
              const vel = Math.round(ts.reduce((s, t) => s + t.velocityScore, 0) / ts.length);
              const lead = [...ts].sort((a, b) => b.overall - a.overall)[0];
              return (
                <button key={c} onClick={() => { setCat(cat === c ? "All" : c); document.getElementById("matrix")?.scrollIntoView({ behavior: "smooth" }); }} className="ti-card" style={{ textAlign: "left", background: cat === c ? "rgba(240,180,41,.08)" : C.panel, border: "none", padding: "18px 16px", color: "inherit", cursor: "pointer", fontFamily: SANS }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><Kicker color={cat === c ? C.gold : C.mute}>{c}</Kicker><span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{ts.length}</span></div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                    <span style={{ fontFamily: SERIF, fontSize: 42, color: C.head, lineHeight: 1 }}>{avg}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: vel >= 56 ? C.green : vel <= 44 ? C.orange : C.soft }}>{vel >= 56 ? "▲" : vel <= 44 ? "▼" : "▬"} {vel}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.body, marginTop: 8 }}>Leader: <span style={{ color: C.head }}>{lead.name}</span></div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 10 — BLR relevance */}
        <section id="blr" className="ti-section">
          <SectionHead num="10" kicker="Commercial relevance to BLR / BIAL" title={<>From signal to <span style={{ fontStyle: "italic", color: C.gold }}>airport opportunity</span></>} sub="BLR relevance = 45% analyst fit for an airport format + 20% India/Bengaluru presence + 20% overall trend score + 15% velocity. Anything marked Act now or Pilot is ready to hand to the opportunity pipeline." />
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {blrRanked.map((t, i) => (
              <div key={t.id} className="ti-blr" style={{ background: C.panel }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <button onClick={() => setOpen(t)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: SERIF, fontSize: 26, color: C.head, textAlign: "left" }}>{t.name}</button>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", color: C.mute, marginTop: 4 }}>{t.blr.vertical.toUpperCase()} · {t.blr.zone.toUpperCase()}</div>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.body }}>
                  {t.blr.play}
                  {t.blr.links && t.blr.links.length > 0 && (
                    <span style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                      {t.blr.links.map((l) => <Link key={l.href + l.label} href={l.href} className="ti-link">{l.label} →</Link>)}
                    </span>
                  )}
                </p>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: SERIF, fontSize: 36, lineHeight: 1, color: VERDICT_COLOR[t.verdict] }}>{t.blrRelevance}</div>
                  <div style={{ marginTop: 6 }}><Pill color={VERDICT_COLOR[t.verdict]} solid={t.verdict === "Act now"}>{t.verdict}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sources & method */}
        <section id="sources" className="ti-section">
          <SectionHead num="—" kicker="Sources, coverage & method" title={<>What&apos;s <span style={{ fontStyle: "italic", color: C.gold }}>actually</span> measured</>} sub={snap.collector} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {snap.platforms.map((p) => (
              <div key={p.id} style={{ background: C.panel, padding: "16px 16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 24, color: C.head }}>{p.label}</span>
                  <Pill color={p.mode === "live" ? C.green : p.mode === "proxy" ? C.cyan : C.dim}>{p.mode === "disconnected" ? "Not connected" : p.mode}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: C.body, marginTop: 8, lineHeight: 1.5 }}>{p.sourceLabel}</div>
                {p.mode !== "live" && p.howToConnect && <div style={{ fontFamily: MONO, fontSize: 10, color: C.mute, marginTop: 10, lineHeight: 1.6, letterSpacing: ".02em" }}>{p.howToConnect}</div>}
              </div>
            ))}
          </div>
          <ul style={{ margin: "18px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {snap.notes.map((n) => <li key={n} style={{ fontSize: 12.5, color: C.mute, lineHeight: 1.55, paddingLeft: 16, position: "relative" }}><span style={{ position: "absolute", left: 0, color: C.gold }}>·</span>{n}</li>)}
          </ul>
          <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", color: C.dim, lineHeight: 1.9 }}>
            OVERALL = 0.5·REACH + 0.3·VELOCITY + 0.2·BREADTH &nbsp;|&nbsp; VELOCITY_p = 50 + 50·tanh(1.1·ln(v_p ÷ median v_p)) &nbsp;|&nbsp; JSON: <a href="/api/trends-intel" style={{ color: C.gold }}>/api/trends-intel</a>
          </div>
        </section>
      </main>

      {open && <Drawer t={open} status={status} onClose={() => setOpen(null)} />}
    </div>
  );
}

// --- pieces -----------------------------------------------------------------
function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="ti-fgroup">
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".22em", color: C.dim, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} className={`ti-chip ${value === v ? "on" : ""}`}>{l}</button>)}
      </div>
    </div>
  );
}

function MatrixCell({ t, p, st }: { t: TrendRecord; p: PlatformId; st?: PlatformStatus }) {
  const r = t.platforms[p];
  if (st?.mode === "disconnected") return <td><div className="ti-cell off" title={`${st.label} not connected — ${st.howToConnect ?? ""}`}>—</div></td>;
  if (r.intensity == null) return <td><div className="ti-cell na" title="No data for this trend on this platform">n/a</div></td>;
  const lv = level(r.intensity);
  const hot = isHot(r.intensity, r.velocity);
  return (
    <td>
      <div className="ti-cell" title={`${PLATFORM_SHORT[p]} intensity ${r.intensity}/100${r.velocity != null ? ` · velocity ×${r.velocity}` : ""}`} style={{ background: `rgba(240,180,41,${0.03 + (r.intensity / 100) * 0.2})` }}>
        <span style={{ color: lv.tone }}>{hot ? "🔥 " : ""}{lv.label}</span>
        <span style={{ display: "block", height: 2, marginTop: 5, background: "rgba(255,255,255,.06)" }}><span style={{ display: "block", height: 2, width: `${r.intensity}%`, background: lv.tone }} /></span>
      </div>
    </td>
  );
}

function SpreadList({ title, color, items, empty, onOpen, showDominant }: { title: string; color: string; items: TrendRecord[]; empty: string; onOpen: (t: TrendRecord) => void; showDominant?: boolean }) {
  return (
    <Panel style={{ padding: 0 }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between" }}>
        <Kicker color={color}>{title}</Kicker><span style={{ fontFamily: SERIF, fontSize: 24, color: C.head, lineHeight: 1 }}>{items.length}</span>
      </div>
      {items.length === 0 ? <div style={{ padding: 18, fontSize: 13, color: C.mute }}>{empty}</div> : items.map((t) => (
        <button key={t.id} onClick={() => onOpen(t)} className="ti-srow">
          <span style={{ color: C.head, fontSize: 14.5 }}>{t.name}</span>
          <span style={{ display: "flex", gap: 3 }}>
            {PLATFORM_ORDER.map((p) => {
              const i = t.platforms[p].intensity;
              const dom = showDominant && t.dominantPlatform === p;
              return <span key={p} title={`${PLATFORM_SHORT[p]} ${i ?? "—"}`} style={{ width: 14, height: 14, background: i == null ? "rgba(255,255,255,.04)" : `rgba(240,180,41,${0.1 + (i / 100) * 0.9})`, outline: dom ? `1px solid ${C.cyan}` : "none", outlineOffset: 1 }} />;
            })}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: showDominant ? C.cyan : C.mute, letterSpacing: ".12em", textAlign: "right" }}>{showDominant && t.dominantPlatform ? PLATFORM_SHORT[t.dominantPlatform].toUpperCase() : `${Math.round(t.breadth * 100)}% BREADTH`}</span>
        </button>
      ))}
    </Panel>
  );
}

function Drawer({ t, status, onClose }: { t: TrendRecord; status: Record<PlatformId, PlatformStatus>; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(2,3,6,.55)", backdropFilter: "blur(2px)" }} />
      <aside role="dialog" aria-label={`${t.name} trend detail`} className="ti-drawer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "20px 22px 16px", borderBottom: `1px solid ${C.line}` }}>
          <div>
            <Kicker color={C.cyan}>{t.category} · trend read</Kicker>
            <div style={{ fontFamily: SERIF, fontSize: 38, lineHeight: 1, color: C.head, marginTop: 8 }}>{t.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <Pill color={LIFE_COLOR[t.lifecycle]}>{t.lifecycle}</Pill>
              <Pill color={VERDICT_COLOR[t.verdict]} solid={t.verdict === "Act now"}>{t.verdict}</Pill>
              <Pill color={C.mute}>{t.spread}</Pill>
            </div>
          </div>
          <button onClick={onClose} className="ti-hide-btn">CLOSE</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "18px 22px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {[["OVERALL", t.overall, C.gold], ["REACH", t.momentum, C.head], ["VELOCITY", t.velocityScore, t.velocityScore >= 62 ? C.green : t.velocityScore < 42 ? C.orange : C.head], ["BLR", t.blrRelevance, VERDICT_COLOR[t.verdict]]].map(([k, v, c]) => (
              <div key={k as string} style={{ background: C.panel, padding: "12px 10px" }}><div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".2em", color: C.mute }}>{k}</div><div style={{ fontFamily: SERIF, fontSize: 30, color: c as string, lineHeight: 1.1 }}>{v}</div></div>
            ))}
          </div>

          <DrawerLabel>Search interest · 90 days (Wikipedia proxy)</DrawerLabel>
          <Spark series={t.series} w={380} h={64} color={LIFE_COLOR[t.lifecycle]} fluid />

          <DrawerLabel>By platform</DrawerLabel>
          {PLATFORM_ORDER.map((p) => {
            const r = t.platforms[p];
            const off = status[p]?.mode === "disconnected";
            return (
              <div key={p} style={{ display: "grid", gridTemplateColumns: "92px 1fr 64px", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", color: off ? C.dim : C.soft }}>{PLATFORM_SHORT[p].toUpperCase()}</span>
                {off || r.intensity == null ? (
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.dim, letterSpacing: ".1em" }}>{off ? "NOT CONNECTED" : "NO DATA"}</span>
                ) : (
                  <div>
                    <div style={{ height: 5, background: "rgba(255,255,255,.06)" }}><div style={{ height: 5, width: `${r.intensity}%`, background: level(r.intensity).tone }} /></div>
                    {r.raw && <div style={{ fontFamily: MONO, fontSize: 9, color: C.dim, marginTop: 4 }}>{Object.entries(r.raw).map(([k, v]) => `${k} ${typeof v === "number" ? v.toLocaleString("en-IN") : v}`).join(" · ")}</div>}
                  </div>
                )}
                <span style={{ fontFamily: MONO, fontSize: 11, textAlign: "right", color: r.velocity != null && r.velocity >= 1.15 ? C.green : r.velocity != null && r.velocity < 0.85 ? C.orange : C.mute }}>{r.intensity != null && !off ? `${r.intensity}${r.velocity != null ? ` ×${r.velocity}` : ""}` : ""}</span>
              </div>
            );
          })}

          <DrawerLabel>Geography</DrawerLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {GEOS.map((g) => (
              <div key={g.id}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: C.mute }}>{g.label.toUpperCase()}</div>
                <div style={{ height: 40, marginTop: 6, background: "rgba(255,255,255,.04)", position: "relative" }}><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${t.geo[g.id] ?? 0}%`, background: g.id === "bengaluru" ? C.gold : "rgba(240,180,41,.45)" }} /></div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.soft, marginTop: 4 }}>{t.geo[g.id] ?? "—"}</div>
              </div>
            ))}
          </div>

          <DrawerLabel>Does it matter for BLR?</DrawerLabel>
          <div style={{ border: `1px solid ${C.gold}40`, background: "rgba(240,180,41,.05)", padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".16em", color: C.gold }}>{t.blr.vertical.toUpperCase()} · {t.blr.zone.toUpperCase()} · ANALYST FIT {t.blr.fit}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.ink, margin: "10px 0 0" }}>{t.blr.play}</p>
            {t.blr.links && t.blr.links.length > 0 && <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>{t.blr.links.map((l) => <Link key={l.href + l.label} href={l.href} className="ti-link">{l.label} →</Link>)}</div>}
          </div>

          <DrawerLabel>Evidence from this sweep</DrawerLabel>
          {t.evidence.length === 0 && <div style={{ fontSize: 12.5, color: C.mute }}>No evidence items captured.</div>}
          {t.evidence.map((e, i) => (
            <a key={i} href={e.url} target="_blank" rel="noreferrer" className="ti-row" style={{ display: "block", padding: "10px 0", borderBottom: `1px solid ${C.line}`, textDecoration: "none" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: e.platform === "youtube" ? C.orange : C.cyan }}>{PLATFORM_SHORT[e.platform].toUpperCase()}{e.source ? ` · ${e.source}` : ""}{e.metric ? ` · ${e.metric}` : ""}{e.date ? ` · ${new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : ""}</div>
              <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{e.title}</div>
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}

const DrawerLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".24em", color: C.mute, textTransform: "uppercase", margin: "24px 0 10px" }}>{children}</div>
);

const CSS = `
.ti-root ::selection{background:${C.gold};color:${C.bg}}
.ti-live{display:inline-flex;align-items:center;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:${C.gold};border:1px solid rgba(240,180,41,.35);padding:5px 10px;text-decoration:none}
.ti-live:hover{background:rgba(240,180,41,.1)}
.ti-blink{width:6px;height:6px;border-radius:50%;background:${C.gold};display:block;animation:ti-blink 1.8s infinite}
@keyframes ti-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes ti-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.ti-rise{animation:ti-rise .9s cubic-bezier(.16,1,.3,1) both}
.ti-kpis{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:${C.line};border:1px solid ${C.line}}
.ti-filters{position:sticky;top:64px;z-index:30;display:flex;flex-wrap:wrap;gap:14px 28px;padding:14px 16px;margin:0 0 8px;background:rgba(6,9,14,.86);backdrop-filter:blur(14px);border:1px solid ${C.line}}
.ti-fgroup{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ti-chip{background:none;border:1px solid transparent;color:#9AA5B4;font-family:${MONO};font-size:10px;letter-spacing:.12em;padding:6px 9px;cursor:pointer;text-transform:uppercase}
.ti-chip:hover{color:${C.gold};background:rgba(240,180,41,.08)}
.ti-chip.on{color:${C.gold};border-color:rgba(240,180,41,.5);background:rgba(240,180,41,.12)}
.ti-section{padding-top:72px;scroll-margin-top:140px}
.ti-card{transition:background .25s}
.ti-card:hover{background:${C.panel2}!important}
.ti-row{transition:background .2s}
.ti-row:hover{background:rgba(240,180,41,.05)}
.ti-scroll-x{overflow-x:auto}
.ti-table{width:100%;border-collapse:collapse;font-size:13px}
.ti-table th{font-family:${MONO};font-size:9.5px;letter-spacing:.16em;font-weight:400;color:${C.mute};text-transform:uppercase;padding:14px 10px;border-bottom:1px solid ${C.line};text-align:center;white-space:nowrap}
.ti-table td{padding:10px;border-bottom:1px solid ${C.line};text-align:center;vertical-align:middle}
.ti-table th:first-child,.ti-table td:first-child{padding-left:18px}
.ti-tr{cursor:pointer;transition:background .2s}
.ti-tr:hover{background:rgba(240,180,41,.045)}
.ti-cell{min-width:78px;padding:8px 8px 7px;font-family:${MONO};font-size:10.5px;letter-spacing:.04em;white-space:nowrap}
.ti-cell.off{color:#3A4452;background:repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 6px,transparent 6px 12px)}
.ti-cell.na{color:${C.dim}}
.ti-heat{font-family:${MONO};font-size:11px;padding:9px 6px;min-width:64px}
.ti-vrow{display:grid;grid-template-columns:minmax(150px,1.1fr) minmax(120px,2fr) 40px 120px 120px;gap:18px;align-items:center;width:100%;background:none;border:none;border-bottom:1px solid ${C.line};padding:12px 18px;cursor:pointer;text-align:left;font-family:${SANS};color:inherit}
.ti-vrow:last-child{border-bottom:none}
.ti-vrow:hover{background:rgba(240,180,41,.045)}
.ti-srow{display:grid;grid-template-columns:1fr auto 110px;gap:14px;align-items:center;width:100%;background:none;border:none;border-bottom:1px solid ${C.line};padding:12px 18px;cursor:pointer;text-align:left;font-family:${SANS};color:inherit}
.ti-srow:hover{background:rgba(240,180,41,.045)}
.ti-life{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:${C.line};border:1px solid ${C.line}}
.ti-lchip{display:flex;justify-content:space-between;gap:8px;background:rgba(255,255,255,.025);border:none;color:${C.ink};font-family:${SANS};font-size:13px;padding:8px 10px;cursor:pointer;text-align:left}
.ti-lchip:hover{background:rgba(240,180,41,.08)}
.ti-blr{display:grid;grid-template-columns:36px minmax(180px,1fr) minmax(0,2fr) 110px;gap:20px;align-items:center;padding:18px 20px}
.ti-link{background:none;border:none;padding:0;cursor:pointer;font-family:${MONO};font-size:10px;letter-spacing:.14em;color:${C.gold};text-decoration:none;text-transform:uppercase}
.ti-link:hover{color:${C.goldHi}}
.ti-drawer{position:fixed;top:0;right:0;bottom:0;z-index:90;width:min(460px,100vw);display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(6,9,14,.98),rgba(6,9,14,.94));backdrop-filter:blur(22px);border-left:1px solid rgba(127,212,255,.2);animation:ti-slide .5s cubic-bezier(.16,1,.3,1)}
@keyframes ti-slide{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.ti-hide-btn{background:none;border:1px solid rgba(255,255,255,.16);color:#8894A3;font-family:${MONO};font-size:9px;letter-spacing:.2em;padding:7px 10px;cursor:pointer}
.ti-hide-btn:hover{border-color:${C.gold};color:${C.gold}}
@media (max-width:1080px){.ti-hide-sm{display:none!important}.ti-vrow{grid-template-columns:minmax(120px,1fr) minmax(100px,2fr) 40px}}
@media (max-width:900px){.ti-stack,.ti-two{grid-template-columns:1fr!important}.ti-life{grid-template-columns:1fr 1fr}.ti-blr{grid-template-columns:28px 1fr 80px}.ti-blr p{grid-column:2/4}@media (max-width:560px){.ti-life{grid-template-columns:1fr}.ti-srow{grid-template-columns:1fr 90px}.ti-srow>span:nth-child(2){display:none}}
@media (prefers-reduced-motion:reduce){.ti-rise,.ti-drawer,.ti-live{display:inline-flex;align-items:center;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:${C.gold};border:1px solid rgba(240,180,41,.35);padding:5px 10px;text-decoration:none}
.ti-live:hover{background:rgba(240,180,41,.1)}
.ti-blink{animation:none!important}}
`;
