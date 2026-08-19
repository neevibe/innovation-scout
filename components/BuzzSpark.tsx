import type { BuzzProfile, BuzzTrajectory } from "@/lib/types";

const TRAJ_COLOR: Record<BuzzTrajectory, string> = {
  Emerging: "#7fd6a0",
  Accelerating: "#7fd6a0",
  Sustained: "#b9c6d6",
  Plateauing: "#d8c98a",
  Fading: "#e0b877",
  "Spike-and-fade": "#e8908f",
};

// Sparkline of monthly buzz index + trajectory + persistence — the "how long
// has this been a buzzword" answer, distinguishing durable trends from spikes.
export function BuzzSpark({ buzz, w = 132, h = 34 }: { buzz: BuzzProfile; w?: number; h?: number }) {
  const color = TRAJ_COLOR[buzz.trajectory];
  const max = Math.max(...buzz.monthly, 1);
  const n = buzz.monthly.length;
  const pts = buzz.monthly.map((v, i) => {
    const x = (i / (n - 1)) * (w - 4) + 2;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[n - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  const gid = `bz-${buzz.trajectory.replace(/\W/g, "")}-${w}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={w} height={h} style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === n - 1 ? 2.6 : 0} fill={color} />
        ))}
      </svg>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color }}>{buzz.trajectory}</div>
        <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>
          active {buzz.monthsActive}/{buzz.windowMonths} mo · persistence {(buzz.persistence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
