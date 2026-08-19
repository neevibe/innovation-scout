"use client";

import { useState } from "react";

export interface MarketRow { code: string; city: string; pax: number; atm: number; slf: number; pick: boolean }

// Interactive bubble chart of the real BLR data: x = flights, y = passengers,
// bubble size = seat load factor. Green = selected, grey = not. Hover for detail.
// Shows WHY passengers (y) beat flights (x): the top-y bubbles aren't the top-x.
export function MarketChart({ domestic, international }: { domestic: MarketRow[]; international: MarketRow[] }) {
  const [tab, setTab] = useState<"domestic" | "international">("domestic");
  const [hover, setHover] = useState<MarketRow | null>(null);
  const rows = tab === "domestic" ? domestic : international;

  const W = 640, H = 380, padL = 66, padR = 20, padT = 20, padB = 46;
  const maxX = Math.max(...rows.map((r) => r.atm)) * 1.12;
  const maxY = Math.max(...rows.map((r) => r.pax)) * 1.12;
  const px = (v: number) => padL + (v / maxX) * (W - padL - padR);
  const py = (v: number) => H - padB - (v / maxY) * (H - padT - padB);
  const rr = (slf: number) => 6 + ((slf - 70) / 25) * 20; // SLF 70→95 maps ~6→26

  const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : (n / 1e3).toFixed(0) + "k");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["domestic", "international"] as const).map((t) => (
          <button key={t} className={`btn ${tab === t ? "btn-primary" : ""}`} style={{ fontSize: 12, padding: "7px 14px", textTransform: "capitalize" }} onClick={() => { setTab(t); setHover(null); }}>{t}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted-2)", alignSelf: "center" }}>bubble size = seat load factor · green = selected</div>
      </div>
      <div style={{ position: "relative", overflow: "auto" }}>
        <svg width={W} height={H} style={{ maxWidth: "100%" }}>
          {/* grid */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={padL} y1={py(maxY * f)} x2={W - padR} y2={py(maxY * f)} stroke="rgba(255,255,255,0.06)" />
              <text x={padL - 8} y={py(maxY * f) + 3} textAnchor="end" fontSize="9" fill="var(--muted-2)">{fmt(maxY * f)}</text>
            </g>
          ))}
          {/* axes labels */}
          <text x={(W + padL) / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">Flights (ATM) →</text>
          <text x={16} y={(H) / 2} textAnchor="middle" fontSize="11" fill="var(--muted)" transform={`rotate(-90 16 ${H / 2})`}>Passengers →</text>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <text key={f} x={px(maxX * f)} y={H - padB + 16} textAnchor="middle" fontSize="9" fill="var(--muted-2)">{fmt(maxX * f)}</text>
          ))}
          {/* bubbles */}
          {rows.map((r) => {
            const active = hover?.code === r.code;
            const c = r.pick ? "#34e3c8" : "#8a90a6";
            return (
              <g key={r.code} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <circle cx={px(r.atm)} cy={py(r.pax)} r={rr(r.slf)} fill={c} fillOpacity={active ? 0.5 : 0.28} stroke={c} strokeWidth={active ? 2.5 : 1.5} />
                <text x={px(r.atm)} y={py(r.pax) - rr(r.slf) - 4} textAnchor="middle" fontSize="10.5" fontWeight={r.pick ? 700 : 500} fill={r.pick ? "#7ff0dd" : "var(--muted)"}>{r.city}</text>
              </g>
            );
          })}
        </svg>
        {hover && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(12,14,21,0.94)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: "10px 12px", fontSize: 12, pointerEvents: "none" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{hover.city} ({hover.code})</div>
            <div className="muted">Passengers: <b style={{ color: "var(--text)" }}>{hover.pax.toLocaleString("en-IN")}</b></div>
            <div className="muted">Flights: <b style={{ color: "var(--text)" }}>{hover.atm.toLocaleString("en-IN")}</b></div>
            <div className="muted">Load factor: <b style={{ color: hover.slf >= 88 ? "#34e3c8" : hover.slf < 80 ? "var(--warn)" : "var(--text)" }}>{hover.slf}%</b></div>
            <div style={{ marginTop: 4, color: hover.pick ? "#34e3c8" : "var(--muted-2)", fontWeight: 600 }}>{hover.pick ? "✓ selected" : "not selected"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
