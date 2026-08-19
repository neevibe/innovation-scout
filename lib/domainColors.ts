import type { Vertical } from "@/lib/types";

// Vibrant, distinguishable colour per domain — used on badges, charts, accents.
export const DOMAIN_COLOR: Record<Vertical, string> = {
  Retail: "#f59e0b",              // amber
  "F&B": "#ef4444",              // red
  "Duty Free": "#a855f7",        // violet
  "Products & SKUs": "#14b8a6",  // teal
  Services: "#3b82f6",           // blue
  Experiences: "#ec4899",        // pink
  Technology: "#06b6d4",         // cyan
  Wellness: "#22c55e",           // green
  "Travel Services": "#6366f1",  // indigo
  "Media & Advertising": "#f97316", // orange
};

export function domainColor(v: string): string {
  return (DOMAIN_COLOR as Record<string, string>)[v] || "#94a3b8";
}
