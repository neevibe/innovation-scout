// Lightweight inline SVG icon set (no dependency). Stroke-consistent, 1.6px.
import type { CSSProperties } from "react";

const P: Record<string, string> = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  trend: "M3 17l6-6 4 4 8-8M21 7v5h-5",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18Zm0 0c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9m0-18c-2.5 2.5-3.5 6-3.5 9s1 6.5 3.5 9M3.5 9h17M3.5 15h17",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18Zm4 5l-2.4 5.6L8 16l2.4-5.6L16 8Z",
  pipeline: "M4 6h10M4 12h16M4 18h7M17 4l3 2-3 2M14 10l3 2-3 2M11 16l3 2-3 2",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 016 0v2",
  doc: "M7 3h7l4 4v14H7V3Zm7 0v4h4M9 12h6M9 16h6",
  gear: "M12 9a3 3 0 100 6 3 3 0 000-6Zm8.5 3a8.5 8.5 0 00-.2-1.8l2-1.5-2-3.4-2.3 1a7 7 0 00-3-1.7L14.5 2h-5l-.5 2.4a7 7 0 00-3 1.7l-2.3-1-2 3.4 2 1.5a8.5 8.5 0 000 3.6l-2 1.5 2 3.4 2.3-1a7 7 0 003 1.7L9.5 22h5l.5-2.4a7 7 0 003-1.7l2.3 1 2-3.4-2-1.5c.13-.6.2-1.2.2-1.8Z",
  refresh: "M20 11a8 8 0 10-.6 4M20 5v6h-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  spark: "M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3Z",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z",
  users: "M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7Zm10.5 8v-1.5a3.5 3.5 0 00-2.6-3.4M15 4.2a3.5 3.5 0 010 6.6",
  check: "M5 12l4.5 4.5L19 7",
  external: "M14 5h5v5M19 5l-8 8M12 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-6",
};

export function Icon({ name, size = 18, color, style }: { name: keyof typeof P | string; size?: number; color?: string; style?: CSSProperties }) {
  const d = P[name] || P.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <path d={d} />
    </svg>
  );
}
