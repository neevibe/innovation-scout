"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoutConfig, City } from "@/lib/types";
import { FACTOR_LABELS } from "@/lib/scoring/engine";
import type { FactorKey } from "@/lib/types";

export function AdminClient({ config, cities }: { config: ScoutConfig; cities: City[] }) {
  const router = useRouter();
  const [weights, setWeights] = useState(config.weights);
  const [thresholds, setThresholds] = useState(config.thresholds);
  const [freq, setFreq] = useState(config.monitoringFrequencyHours);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights, thresholds, monitoringFrequencyHours: freq }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 750 }}>⚖️ Scoring Weights</h2>
          <span className="badge" style={{ borderColor: Math.round(total) === 100 ? "#a7e0b8" : "#f0d28a", color: Math.round(total) === 100 ? "var(--ok)" : "var(--warn)", background: Math.round(total) === 100 ? "rgba(127,214,160,0.15)" : "rgba(224,184,119,0.15)" }}>
            Total {total.toFixed(0)}% {Math.round(total) === 100 ? "✓" : "(auto-normalised)"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 16px" }}>Weights re-rank every opportunity live. They are auto-normalised to 100% if they don't sum exactly.</div>
        {(Object.keys(weights) as FactorKey[]).map((k) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "220px 1fr 54px", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>{FACTOR_LABELS[k]}</label>
            <input
              type="range" min={0} max={30} value={weights[k]}
              onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
              style={{ accentColor: "#e8ebee" }}
            />
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{weights[k]}%</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🎚️ Thresholds</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Num label="Immediate ≥" v={thresholds.immediate} on={(v) => setThresholds({ ...thresholds, immediate: v })} />
          <Num label="High Potential ≥" v={thresholds.highPotential} on={(v) => setThresholds({ ...thresholds, highPotential: v })} />
          <Num label="Monitor ≥" v={thresholds.monitor} on={(v) => setThresholds({ ...thresholds, monitor: v })} />
          <Num label="Matrix split (attractiveness)" v={thresholds.matrixAttractiveness} on={(v) => setThresholds({ ...thresholds, matrixAttractiveness: v })} />
          <Num label="Matrix split (feasibility)" v={thresholds.matrixFeasibility} on={(v) => setThresholds({ ...thresholds, matrixFeasibility: v })} />
          <Num label="Monitoring frequency (hours)" v={freq} on={setFreq} max={168} />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🌍 Pilot Cities</h2>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Editable via <span className="kbd">PUT /api/cities</span>. Current pilot set:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cities.map((c) => (
            <span key={c.id} className="badge">{c.kind === "domestic" ? "🏠" : "✈️"} {c.name} · {c.benchmarkAirport}</span>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 15, fontWeight: 750 }}>🔐 Data Sources & Keys (Super Admin only)</h2>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Mode <span className="kbd">{config.mode}</span>. Set <span className="kbd">SCOUT_MODE=live</span> plus a search provider + <span className="kbd">AI_GATEWAY_API_KEY</span> in env to enable real collection. API keys are never exposed to non-admin roles.
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save configuration"}
      </button>
    </div>
  );
}

function Num({ label, v, on, max = 100 }: { label: string; v: number; on: (v: number) => void; max?: number }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type="number" value={v} min={0} max={max}
        onChange={(e) => on(Number(e.target.value))}
        className="btn"
        style={{ width: "100%", padding: "8px 10px" }}
      />
    </div>
  );
}
