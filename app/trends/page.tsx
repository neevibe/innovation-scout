import { Repo } from "@/lib/db/store";
import { getPageData } from "@/lib/view";
import { Topbar } from "@/components/Topbar";
import { SixMonthLens } from "@/components/SixMonthLens";
import { buildSixMonthReport } from "@/lib/intelligence/sixMonth";

export const dynamic = "force-dynamic";

const TIER_SOURCE: Record<number, string> = { 1: "Official", 2: "High-quality media", 3: "Industry", 4: "Social" };

export default async function TrendsPage() {
  const { config } = await getPageData();
  const [allSignals, cities, portfolio] = await Promise.all([Repo.signals(), Repo.cities(), Repo.portfolio()]);
  const { opportunities } = await getPageData();
  const report = buildSixMonthReport(cities, allSignals, portfolio, opportunities);
  const signals = report.recentSignals;

  const byType = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.signalType] = (acc[s.signalType] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Topbar title="Trend Intelligence" subtitle={`Six-month evidence window · ${report.windowLabel}`} mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "28px 34px 48px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {Object.entries(byType).map(([t, n]) => (
            <span key={t} className="badge" style={{ fontSize: 12, padding: "6px 12px" }}>{t}: <b style={{ marginLeft: 4 }}>{n}</b></span>
          ))}
        </div>

        <SixMonthLens cityPulses={report.cityPulses} gaps={report.gaps} windowLabel={report.windowLabel} compact />

        <div className="card" style={{ overflow: "auto", marginTop: 22 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Detected</th>
                <th>City</th>
                <th>Brand / Concept</th>
                <th>Category</th>
                <th>Trend</th>
                <th>Type</th>
                <th>Source tier</th>
                <th>Corroboration</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(s.firstDetectedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                  <td>{s.city}</td>
                  <td style={{ fontWeight: 650 }}>
                    {s.opportunityId ? (
                      <a href={`/opportunities/${s.opportunityId}`} style={{ color: "var(--accent)" }}>{s.brand || s.subCategory}</a>
                    ) : (
                      s.brand || s.subCategory
                    )}
                  </td>
                  <td><span className="muted">{s.category}</span> · {s.subCategory}</td>
                  <td style={{ maxWidth: 300 }}>{s.trend}</td>
                  <td><span className="badge">{s.signalType}</span></td>
                  <td>{TIER_SOURCE[s.sourceTier]}</td>
                  <td>
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{s.source} ↗</a>
                    {s.corroboratingUrls.length > 0 && <span className="muted"> +{s.corroboratingUrls.length}</span>}
                  </td>
                  <td>
                    <span style={{ display: "inline-block", width: 42, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.1)", position: "relative", overflow: "hidden", verticalAlign: "middle" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${s.confidence}%`, background: s.confidence >= 75 ? "var(--ok)" : "var(--warn)" }} />
                    </span>{" "}
                    {s.confidence}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
