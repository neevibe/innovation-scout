import type { Vertical } from "@/lib/types";

// Distinguishable per-domain colours, tuned to the console palette (gold/orange/cyan/green on #04060A).
export const DOMAIN_COLOR: Record<Vertical, string> = {
  Retail: "#F0B429",              // console gold
  "F&B": "#FF7A45",              // signal orange
  "Duty Free": "#FFD87A",        // pale gold
  "Products & SKUs": "#D9C08A",  // sand
  Services: "#7FD4FF",           // console cyan
  Experiences: "#E8A0C8",        // muted rose
  Technology: "#8FB8FF",         // steel blue
  Wellness: "#6FE3A8",           // console green
  "Travel Services": "#B7C2FF",  // lavender-grey
  "Media & Advertising": "#FF9E6B", // soft orange
};

export function domainColor(v: string): string {
  return (DOMAIN_COLOR as Record<string, string>)[v] || "#94a3b8";
}
