import snapshot from "@/lib/data/trendsSnapshot.json";
import type { TrendSnapshot } from "@/lib/trends/types";
import { TrendIntelClient } from "@/components/trends/TrendIntelClient";

export const metadata = {
  title: "Trend Intelligence — BIAL Innovation Scout",
  description: "What's trending, where it's trending, how fast it's growing, and whether it matters for Bengaluru Airport.",
};

export default function TrendIntelligencePage() {
  return <TrendIntelClient snap={snapshot as unknown as TrendSnapshot} />;
}
