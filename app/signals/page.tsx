import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { MotionGrid, MotionItem } from "@/components/Motion";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { SignalType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<SignalType, string> = {
  "Emerging Brand": "bag",
  "Emerging Concept": "spark",
  "Category Growth": "trend",
  "Airport Innovation": "globe",
  "Commercial Gap": "compass",
  "Competitive Movement": "pin",
  "Partnership Opportunity": "users",
};

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function relevance(conf: number): { label: string; color: string } {
  if (conf >= 78) return { label: "HIGH", color: "var(--ok)" };
  if (conf >= 55) return { label: "MEDIUM", color: "var(--warn)" };
  return { label: "LOW", color: "var(--muted-2)" };
}

export default async function SignalsPage() {
  const { config, opportunities } = await getPageData();
  const signals = [...(await Repo.signals())].sort((a, b) => (b.firstDetectedAt < a.firstDetectedAt ? -1 : 1));
  const oppByBrand = new Map(opportunities.map((o) => [o.brand.toLowerCase(), o.id]));

  return (
    <>
      <Topbar title="Live Signals" subtitle="Every consolidated intelligence event, newest first" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span className="live-dot" />
          <span className="eyebrow">{signals.length} signals · {new Set(signals.map((s) => s.source)).size} sources</span>
        </div>

        <MotionGrid style={{ display: "grid", gap: 12, maxWidth: 900 }}>
          {signals.map((s) => {
            const rel = relevance(s.confidence);
            const linkedOpp = s.opportunityId || (s.brand && oppByBrand.get(s.brand.toLowerCase()));
            return (
              <MotionItem key={s.id}>
                <div className="card" style={{ padding: 18, display: "flex", gap: 15 }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, background: "var(--accent-soft)", color: "var(--text)", display: "grid", placeItems: "center" }}>
                    <Icon name={TYPE_ICON[s.signalType] || "spark"} size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge">{s.signalType}</span>
                      <span className="badge">{s.category}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-2)" }}>· {s.city}, {s.country}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: rel.color, fontWeight: 600, letterSpacing: "0.04em" }}>BIAL relevance: {rel.label}</span>
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 9, lineHeight: 1.3 }}>{s.brand ? `${s.brand} — ` : ""}{s.trend}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>{s.description}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, flexWrap: "wrap", fontSize: 12 }}>
                      <span style={{ color: "var(--muted-2)" }}>Detected {ago(s.firstDetectedAt)}</span>
                      <span style={{ color: "var(--muted-2)" }}>Confidence {s.confidence}%</span>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{s.source} ↗</a>
                      {s.corroboratingUrls.length > 0 && <span style={{ color: "var(--muted-2)" }}>+{s.corroboratingUrls.length} corroborating</span>}
                      <span style={{ flex: 1 }} />
                      {linkedOpp ? (
                        <Link href={`/opportunities/${linkedOpp}`} className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>Investigate <Icon name="arrow" size={13} /></Link>
                      ) : (
                        <Link href="/trends" className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>Compare</Link>
                      )}
                    </div>
                  </div>
                </div>
              </MotionItem>
            );
          })}
        </MotionGrid>
      </div>
    </>
  );
}
