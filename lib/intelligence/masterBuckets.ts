import type { MasterBucketRow, Signal } from "@/lib/types";
import { buildMasterySheet } from "@/lib/agents/mastery";

// ===========================================================================
// Master Agent — reviews every scraping agent's findings (already collated
// into the mastery sheet by dedupeKey/cross-source convergence) and re-groups
// them by business vertical, so leadership reads "what's new in F&B" instead
// of one flat list. This is a pure re-projection: no new scoring, no new
// data — it reuses buildMasterySheet's masteryScore/verdict as-is.
// ===========================================================================

export function buildMasterBuckets(signals: Signal[]): Record<string, MasterBucketRow[]> {
  const sheet = buildMasterySheet(signals);
  const byId = new Map(signals.map((s) => [s.id, s]));

  const buckets: Record<string, MasterBucketRow[]> = {};
  for (const entry of sheet) {
    const primary = byId.get(entry.primarySignalId);
    const vertical = primary?.category || "Retail";
    const row: MasterBucketRow = {
      vertical,
      dedupeKey: entry.dedupeKey,
      topic: entry.topic,
      masteryScore: entry.masteryScore,
      verdict: entry.verdict,
      providerCount: entry.providerCount,
      sourceCount: entry.sourceCount,
      sampleUrl: entry.sources[0]?.url || "#",
      sampleDomain: entry.sources[0]?.domain || "",
    };
    buckets[vertical] = buckets[vertical] || [];
    buckets[vertical].push(row);
  }
  for (const v of Object.keys(buckets)) {
    buckets[v].sort((a, b) => b.masteryScore - a.masteryScore);
  }
  return buckets;
}
