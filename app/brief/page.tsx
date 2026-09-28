import { getPageData } from "@/lib/view";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { TierPill } from "@/components/ScoreBadge";
import { buildMasterySheet } from "@/lib/agents/mastery";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

async function refreshIfStale(): Promise<void> {
  // Server-side stale check. If the last refresh is older than 6h, kick a
  // refresh in the background. Render proceeds from current state.
  try {
    const cfg = await Repo.config();
    const last = cfg.lastRefreshAt ? Date.parse(cfg.lastRefreshAt) : 0;
    if (Date.now() - last < STALE_THRESHOLD_MS) return;
    // Fire-and-forget — refresh is independent of the render path.
    const { runPipeline } = await import("@/lib/agents");
    runPipeline().catch((e) => console.error("[brief] stale-refresh failed:", e));
  } catch (e) {
    console.error("[brief] stale-refresh kick failed:", e);
  }
}

export default async function BriefPage() {
  // Kick stale-refresh BEFORE rendering so the next page load sees fresh data.
  // (The render itself uses the current snapshot — that's intentional.)
  await refreshIfStale();

  const { config, opportunities } = await getPageData();
  const signals = await Repo.signals();
  const mastery = buildMasterySheet(signals).slice(0, 5);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const top5 = opportunities.filter((o) => o.sufficientEvidence).slice(0, 5);
  const brandsToWatch = signals.filter((s) => s.signalType === "Emerging Brand").slice(0, 5);
  const airportBench = signals.filter((s) => s.signalType === "Airport Innovation");
  const competitive = signals.filter((s) => s.signalType === "Competitive Movement");
  const partnerships = opportunities.filter((o) => o.contacts.length > 0).slice(0, 5);

  return (
    <>
      <Topbar title="AI Executive Brief" subtitle={`BIAL Innovation Brief · ${today}`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: 28, maxWidth: 900 }}>
        {mastery.length > 0 && (
          <Section title="Cross-Source Mastery (top convergence)">
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
              Each row shows how many distinct scraping sources independently surfaced the same story.
              <b> Strong</b> = 3+ sources, <b>Moderate</b> = 2, <b>Single</b> = 1 (tier 1-2).
            </div>
            {mastery.map((m) => (
              <div key={m.dedupeKey} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
                <div className="cx-serif" style={{ width: 44, fontSize: 28, lineHeight: 1, color: m.verdict === "strong" ? "var(--ok)" : m.verdict === "moderate" ? "#d4a64a" : "var(--muted)" }}>{m.masteryScore}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--head)", fontSize: 14.5 }}>{m.topic}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    verdict: <b>{m.verdict}</b> · {m.providerCount} provider{m.providerCount === 1 ? "" : "s"} · {m.sourceCount} source{m.sourceCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{new Date(m.lastUpdatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
              </div>
            ))}
          </Section>
        )}

        <Section title="Top 5 Opportunities This Week">
          {top5.map((o, i) => (
            <div key={o.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="cx-mono" style={{ fontSize: 11, width: 30, color: "var(--muted-2)", paddingTop: 6 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1 }}>
                <Link href={`/opportunities/${o.id}`} className="cx-serif" style={{ fontSize: 22, lineHeight: 1.15, color: "var(--head)" }}>{o.title}</Link>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{o.recommendation.whyNow}</div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}><b>Action:</b> {o.recommendation.recommendedNextAction}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="cx-serif" style={{ fontSize: 36, lineHeight: 1, color: "var(--gold)" }}>{o.score}</div>
                <TierPill tier={o.tier} />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Brands to Watch">
          {brandsToWatch.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <b>{s.brand}</b> ({s.city}) — {s.trend}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="Airport Benchmarking">
          {airportBench.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <b>{s.airport}</b> — {s.description}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="Competitive Alerts">
          {competitive.length === 0 && <li className="muted">None this cycle.</li>}
          {competitive.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>{s.description}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="Partnership Opportunities">
          {partnerships.map((o) => (
            <li key={o.id} style={{ marginBottom: 8 }}>
              <b>{o.company}</b> — {o.contacts[0]?.designation}. <Link href={`/opportunities/${o.id}`} style={{ color: "var(--accent)", fontSize: 12 }}>open ↗</Link>
            </li>
          ))}
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const isList = title.includes("Brands") || title.includes("Benchmark") || title.includes("Alerts") || title.includes("Partnership");
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>{title}</h2>
      {isList ? <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{children}</ul> : children}
    </div>
  );
}
