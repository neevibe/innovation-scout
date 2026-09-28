// Re-apply lifecycle/verdict rules to the existing snapshot without re-collecting.
import { readFileSync, writeFileSync } from "node:fs";
import { lifecycleOf, verdictOf } from "@/lib/trends/score";
import { isCommercial } from "@/lib/trends/collect";
import type { TrendSnapshot } from "@/lib/trends/types";

const OUT = "lib/data/trendsSnapshot.json";
const snap = JSON.parse(readFileSync(OUT, "utf8")) as TrendSnapshot;
for (const t of snap.trends) {
  t.lifecycle = lifecycleOf(t.momentum, t.velocityScore, t.series);
  t.verdict = verdictOf(t.blrRelevance, t.lifecycle);
}
for (const n of snap.trendingNow) n.commercial = isCommercial(`${n.title} ${n.news || ""}`);
writeFileSync(OUT, JSON.stringify(snap, null, 2));
console.log(snap.trends.map((t) => `${t.name}: ${t.lifecycle} / ${t.verdict}`).join("\n"));
