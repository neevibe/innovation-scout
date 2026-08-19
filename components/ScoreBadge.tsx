import { TIER_META } from "@/lib/scoring/engine";
import type { OpportunityTier } from "@/lib/types";

export function ScoreDonut({ score, tier, size = 66 }: { score: number; tier: OpportunityTier; size?: number }) {
  const meta = TIER_META[tier];
  const r = (size - 9) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const gid = `g-${tier.replace(/\s/g, "")}-${size}`;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={meta.hi} />
            <stop offset="100%" stopColor={meta.color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="tnum" style={{ fontSize: size * 0.30, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
        <span style={{ fontSize: 8.5, color: "var(--muted-2)", letterSpacing: "0.08em" }}>/ 100</span>
      </div>
    </div>
  );
}

export function TierPill({ tier }: { tier: OpportunityTier }) {
  const meta = TIER_META[tier];
  return (
    <span className="badge" style={{ borderColor: meta.color + "3d", color: meta.color, background: meta.color + "12" }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.color, display: "inline-block" }} />
      {meta.label}
    </span>
  );
}
