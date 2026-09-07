import { Repo } from "@/lib/db/store";
import { Topbar } from "@/components/Topbar";
import { DomainBadge } from "@/components/DomainBadge";
import { buildMasterBuckets } from "@/lib/intelligence/masterBuckets";

export const dynamic = "force-dynamic";

const VERDICT_COLOR: Record<string, string> = {
  strong: "var(--ok)",
  moderate: "#d4a64a",
  single: "var(--muted)",
  noise: "var(--muted-2)",
};

export default async function AgentsPage() {
  const [config, agentRuns, signals] = await Promise.all([Repo.config(), Repo.agentRuns(), Repo.signals()]);
  const latestRun = agentRuns[0];
  const buckets = buildMasterBuckets(signals);
  const verticals = Object.keys(buckets).sort((a, b) => buckets[b].length - buckets[a].length);

  return (
    <>
      <Topbar title="Scraping Agents" subtitle="Per-agent results from the last refresh, reviewed and bucketed by the Master Agent" mode={config.mode} lastRefresh={config.lastRefreshAt} />
      <div style={{ padding: "26px 34px 48px", maxWidth: 1180 }}>
        {!latestRun ? (
          <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
            No refresh has run yet. Click &ldquo;Refresh Intelligence&rdquo; (or RUN GLOBAL SCOUT on the globe) to populate this page with real per-agent results.
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>Last refresh</div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 3 }}>{new Date(latestRun.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>Mode</div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 3 }}>{latestRun.mode === "live" ? "🟢 Live" : "⚪ Offline"}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>Total queries</div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 3 }}>{latestRun.totalQueries}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>Total docs found</div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 3 }}>{latestRun.totalDocs}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 9.5 }}>Agents that ran</div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 3 }}>{latestRun.agents.length}</div>
              </div>
            </div>

            {/* Per-scraper results */}
            <div className="eyebrow" style={{ marginBottom: 12 }}>Individual scraping agents — what each one found</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 14, marginBottom: 34 }}>
              {latestRun.agents.map((a) => (
                <div key={a.providerId} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</span>
                      {a.keyless ? <span className="badge" style={{ fontSize: 9.5 }}>keyless</span> : <span className="badge" style={{ borderColor: "var(--accent)", color: "var(--accent)", fontSize: 9.5 }}>licensed</span>}
                    </div>
                    {a.failed ? (
                      <span className="badge" style={{ borderColor: "#e8908f", color: "var(--danger)" }}>Failed</span>
                    ) : (
                      <span className="badge" style={{ borderColor: "#a7e0b8", color: "var(--ok)" }}>{a.docsFound} docs</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 6, lineHeight: 1.4 }}>{a.complianceNote}</div>
                  {a.sample.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>{a.failed ? "No results — provider unreachable or rate-limited this run." : "No matching docs this run."}</div>
                  ) : (
                    <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
                      {a.sample.map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 12, lineHeight: 1.4, color: "var(--text)", textDecoration: "none", padding: "6px 8px", borderRadius: 7, background: "var(--surface-2)" }}>
                          <span style={{ color: "var(--accent)" }}>{f.title}</span>
                          <span style={{ color: "var(--muted-2)", marginLeft: 6, fontSize: 10.5 }}>· {f.city} · {f.source}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Master Agent bucketed opportunity table */}
            <div className="eyebrow" style={{ marginBottom: 4 }}>Master Agent — collated &amp; bucketed opportunities</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>
              Every scraping agent&rsquo;s findings, deduped by cross-source convergence, grouped by business vertical. Mastery score reflects how many independent providers and how credible the sources are — not a guess.
            </div>
            {verticals.length === 0 ? (
              <div className="card" style={{ padding: 24, color: "var(--muted)" }}>No signals collected yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                {verticals.map((v) => (
                  <div key={v} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <DomainBadge vertical={v} />
                      <span className="badge">{buckets[v].length}</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--muted-2)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".04em" }}>
                          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Topic</th>
                          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Verdict</th>
                          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Providers</th>
                          <th style={{ padding: "6px 8px", fontWeight: 600 }}>Sources</th>
                          <th style={{ padding: "6px 8px", fontWeight: 600, textAlign: "right" }}>Mastery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buckets[v].slice(0, 10).map((row) => (
                          <tr key={row.dedupeKey} style={{ borderTop: "1px solid var(--line)" }}>
                            <td style={{ padding: "8px 8px" }}>
                              <a href={row.sampleUrl} target="_blank" rel="noreferrer" style={{ color: "var(--text)", textDecoration: "none" }}>
                                {row.topic}
                              </a>
                              <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{row.sampleDomain}</div>
                            </td>
                            <td style={{ padding: "8px 8px" }}>
                              <span style={{ color: VERDICT_COLOR[row.verdict] || "var(--muted)", fontWeight: 650, textTransform: "capitalize" }}>{row.verdict}</span>
                            </td>
                            <td style={{ padding: "8px 8px" }}>{row.providerCount}</td>
                            <td style={{ padding: "8px 8px" }}>{row.sourceCount}</td>
                            <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700 }} className="tnum">{row.masteryScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
