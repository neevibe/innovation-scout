import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";
import { buildSixMonthReport } from "@/lib/intelligence/sixMonth";

export const dynamic = "force-dynamic";

export default async function DutyFreePage() {
  const { config, opportunities } = await getPageData();
  const [skus, portfolio, cities, signals] = await Promise.all([Repo.dutyFreeSkus(), Repo.portfolio(), Repo.cities(), Repo.signals()]);
  const dfOpps = opportunities.filter((o) => o.vertical === "Duty Free");
  const report = buildSixMonthReport(cities, signals, portfolio, opportunities);

  return (
    <>
      <Topbar title="Duty Free Gap Engine" subtitle={`Peer signals and BIAL white space · ${report.windowLabel}`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 48px" }}>
        <div className="card" style={{ padding: 16, marginBottom: 18, background: "linear-gradient(115deg,rgba(154,183,255,.13),rgba(155,111,255,.06))" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            <b style={{ color: "var(--text)" }}>Method:</b> BIAL SKU/portfolio reference × competitor-airport assortment × recent brand/market intelligence → gap score, commercial potential, passenger relevance, competitive evidence, feasibility → overall opportunity score.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginBottom: 26 }}>
          {report.gaps.filter((gap) => gap.vertical === "Duty Free").slice(0, 3).map((gap) => (
            <div key={gap.category} className="card lift-card" style={{ padding: 14 }}>
              <div className="eyebrow" style={{ fontSize: 9, color: "#b8ceff" }}>Priority white space</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 5 }}>{gap.category}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>{gap.note}</div>
              {gap.opportunity && <Link href={`/opportunities/${gap.opportunity.id}`} style={{ display: "inline-flex", marginTop: 10, color: "var(--link)", fontSize: 12 }}>Open score {gap.opportunity.score} →</Link>}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 750, margin: "0 0 12px" }}>White-space SKUs & categories</h2>
        <div className="card" style={{ overflow: "auto", marginBottom: 26 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Category</th>
                <th>Candidate brand</th>
                <th>At BIAL?</th>
                <th>At peer hubs</th>
                <th>Signal / note</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((k, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 650 }}>{k.category}</td>
                  <td>{k.brand}</td>
                  <td>{k.presentAtBial ? <span className="badge" style={{ borderColor: "#a7e0b8", color: "var(--ok)", background: "rgba(127,214,160,0.15)" }}>Present</span> : <span className="badge" style={{ borderColor: "#f3b6bb", color: "var(--danger)", background: "rgba(232,144,143,0.15)" }}>Missing</span>}</td>
                  <td>{k.presentAtPeers.join(", ")}</td>
                  <td className="muted">{k.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 750, margin: "0 0 12px" }}>Scored Duty Free opportunities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginBottom: 26 }}>
          {dfOpps.map((o) => (
            <Link key={o.id} href={`/opportunities/${o.id}`} className="card" style={{ padding: 16, display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{o.brand}</span>
                <b style={{ fontSize: 20 }}>{o.score}</b>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{o.category}</div>
              <div style={{ fontSize: 12.5, marginTop: 10 }}>{o.recommendation.bialRecommendation}</div>
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 750, margin: "0 0 12px" }}>BIAL portfolio reference (internal)</h2>
        <div className="card" style={{ overflow: "auto" }}>
          <table className="data">
            <thead>
              <tr><th>Category</th><th>Vertical</th><th>Terminal</th><th>Status</th><th>Present brands</th><th>Note</th></tr>
            </thead>
            <tbody>
              {portfolio.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 650 }}>{p.category}</td>
                  <td>{p.vertical}</td>
                  <td>{p.terminal}</td>
                  <td>{p.present ? <span className="badge" style={{ borderColor: "#a7e0b8", color: "var(--ok)", background: "rgba(127,214,160,0.15)" }}>Covered</span> : <span className="badge" style={{ borderColor: "#f3b6bb", color: "var(--danger)", background: "rgba(232,144,143,0.15)" }}>Gap</span>}</td>
                  <td>{p.brandsPresent.join(", ") || "—"}</td>
                  <td className="muted">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
