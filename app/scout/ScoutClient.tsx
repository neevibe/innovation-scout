"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/Icon";

const SUGGESTIONS = [
  "What new F&B concepts have emerged in our benchmark cities?",
  "Which brands should BIAL consider for Duty Free?",
  "What are competitors doing that BIAL isn't?",
  "Show me premium retail opportunities in Dubai and Singapore",
];

interface ScoutResult {
  summary: string;
  stats: { sourcesScanned: number; signalsAnalysed: number; citiesCompared: number; opportunitiesScored: number };
  opportunities: { id: string; brand: string; vertical: string; city: string; score: number; tier: string; why: string; action: string; image?: string }[];
  signals: { id: string; brand?: string; city: string; trend: string; type: string; url: string; source: string; confidence: number }[];
}

const STEPS = (s: ScoutResult["stats"]) => [
  `Scanning ${s.sourcesScanned} sources`,
  `Analysing ${s.signalsAnalysed} market signals`,
  `Comparing ${s.citiesCompared} cities`,
  "Checking BIAL portfolio for gaps",
  `Scoring ${s.opportunitiesScored} opportunities`,
];

export function ScoutClient() {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<"idle" | "researching" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScoutResult | null>(null);
  const [asked, setAsked] = useState("");

  async function ask(question: string) {
    if (!question.trim()) return;
    setAsked(question);
    setPhase("researching");
    setStep(0);
    setResult(null);

    // kick off the real query
    const p = fetch("/api/scout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: question }) }).then((r) => r.json());

    // animate through research steps while it resolves
    const stepTimer = setInterval(() => setStep((s) => Math.min(s + 1, 4)), 360);
    const data = (await p) as ScoutResult;
    // let the steps finish for effect
    await new Promise((r) => setTimeout(r, 700));
    clearInterval(stepTimer);
    setResult(data);
    setPhase("done");
  }

  const steps = result ? STEPS(result.stats) : STEPS({ sourcesScanned: 0, signalsAnalysed: 0, citiesCompared: 6, opportunitiesScored: 0 });

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Prompt */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--text)", color: "#23282e", display: "grid", placeItems: "center" }}><Icon name="spark" size={17} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>AI Scout</div>
            <div style={{ fontSize: 12, color: "var(--muted-2)" }}>Your commercial research analyst — grounded in collected intelligence</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(q)}
            placeholder="Ask about brands, trends, cities, gaps, competitors…"
            style={{ flex: 1, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)" }}
          />
          <button className="btn btn-primary" onClick={() => ask(q)} disabled={phase === "researching"}>
            <Icon name="spark" size={15} color="#23282e" /> Research
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="btn" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setQ(s); ask(s); }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Researching */}
      <AnimatePresence mode="wait">
        {phase === "researching" && (
          <motion.div key="researching" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ padding: 22, marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Researching “{asked}”</div>
            {steps.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 0", opacity: i <= step ? 1 : 0.35, transition: "opacity 0.3s" }}>
                {i < step ? (
                  <span style={{ color: "var(--ok)" }}><Icon name="check" size={16} /></span>
                ) : i === step ? (
                  <span className="spin-icon" style={{ color: "var(--text)", display: "inline-flex" }}><Icon name="refresh" size={16} /></span>
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: 999, border: "1.5px solid var(--line-strong)" }} />
                )}
                <span style={{ fontSize: 13.5, color: i <= step ? "var(--text)" : "var(--muted)" }}>{label}</span>
              </div>
            ))}
            <style>{`.spin-icon svg{animation:spin 0.9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </motion.div>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Scout answer</div>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0 }}>{result.summary}</p>
              <div style={{ display: "flex", gap: 18, marginTop: 16, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted-2)" }}>
                <span>{result.stats.sourcesScanned} sources scanned</span>
                <span>{result.stats.signalsAnalysed} signals analysed</span>
                <span>{result.stats.citiesCompared} cities compared</span>
                <span>{result.stats.opportunitiesScored} opportunities scored</span>
              </div>
            </div>

            {result.opportunities.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Matched opportunities</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {result.opportunities.map((o) => (
                    <Link key={o.id} href={`/opportunities/${o.id}`} className="card lift-card" style={{ padding: 15, display: "flex", gap: 14, alignItems: "center" }}>
                      {o.image && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={o.image} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />)}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{o.brand}</span>
                          <span className="badge">{o.vertical}</span>
                          <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{o.city}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.action}</div>
                      </div>
                      <div className="tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" }}>{o.score}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {result.signals.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Supporting evidence</div>
                <div className="card" style={{ padding: 6 }}>
                  {result.signals.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid var(--line)" }}>
                      <span className="badge" style={{ flexShrink: 0 }}>{s.type}</span>
                      <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.brand ? `${s.brand} — ` : ""}{s.trend}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{s.city}</span>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12, flexShrink: 0 }}>{s.source} ↗</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
