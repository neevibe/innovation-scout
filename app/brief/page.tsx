import { getPageData } from "@/lib/view";
import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { TierPill } from "@/components/ScoreBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const { config, opportunities } = await getPageData();
  const signals = await Repo.signals();
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
        <Section title="🔥 Top 5 Opportunities This Week">
          {top5.map((o, i) => (
            <div key={o.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 22, fontWeight: 820, width: 30, color: "var(--muted)" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <Link href={`/opportunities/${o.id}`} style={{ fontWeight: 700, color: "var(--accent)" }}>{o.title}</Link>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{o.recommendation.whyNow}</div>
                <div style={{ fontSize: 12.5, marginTop: 6 }}><b>Action:</b> {o.recommendation.recommendedNextAction}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 820 }}>{o.score}</div>
                <TierPill tier={o.tier} />
              </div>
            </div>
          ))}
        </Section>

        <Section title="🏷️ Brands to Watch">
          {brandsToWatch.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <b>{s.brand}</b> ({s.city}) — {s.trend}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="✈️ Airport Benchmarking">
          {airportBench.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <b>{s.airport}</b> — {s.description}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="⚠️ Competitive Alerts">
          {competitive.length === 0 && <li className="muted">None this cycle.</li>}
          {competitive.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>{s.description}{" "}
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>source ↗</a>
            </li>
          ))}
        </Section>

        <Section title="🤝 Partnership Opportunities">
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
