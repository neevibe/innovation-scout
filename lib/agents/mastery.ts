import type { Signal, SourceTier } from "@/lib/types";

// ===========================================================================
// Mastery layer — cross-source verification
// ---------------------------------------------------------------------------
// After the collector's fans-out across all providers and the consolidator
// merges duplicate stories, this module looks at the resulting evidence base
// and decides how much to trust it. The output is a "master answer sheet":
// per-topic (dedupeKey) view of which providers said what, and how much they
// agree.
//
// Design intent:
//   * Each consolidated Signal keeps `corroboratingUrls[]` of every URL
//     (across every provider) that landed on the same dedupeKey. We mine
//     those URLs back to their source provider to compute convergence.
//   * Mastery is a property of the dataset, not the UI — so it lives in the
//     pipeline, gets persisted into the StoreShape, and the UI just renders it.
//   * Tiered "verdict" bands keep anti-hallucination natural: a topic with
//     strong convergence surfaces as a candidate; a single-provider outlier
//     never bubbles up as a primary recommendation.
// ===========================================================================

export type ConvergenceVerdict =
  | "strong"      // 3+ distinct providers agree
  | "moderate"    // 2 distinct providers
  | "single"      // 1 provider, but tier 1-2 source
  | "noise";      // 1 provider, tier 3-4 only — still recorded, sorted to bottom

export interface MasteryEntry {
  dedupeKey: string;            // brand|city|trend fingerprint
  topic: string;                 // human-readable label
  sources: { provider: string; domain: string; tier: SourceTier; url: string }[];
  sourceCount: number;
  providerCount: number;
  minTier: SourceTier;
  masteryScore: number;          // 0–100
  verdict: ConvergenceVerdict;
  firstSeen: string;
  lastUpdatedAt: string;
  primarySignalId: string;
}

const PROVIDER_KEYWORDS = [
  { id: "github", host: "github.com" },
  { id: "tavily", host: "tavily.com" },
  { id: "googlenews", host: "news.google.com" },
  { id: "gdelt", host: "gdeltproject.org" },
];

// Recover which provider surfaced a corroborating URL based on its host.
// We can't always know (providers are documented but URLs are third-party),
// so this is a best-effort label. Anything unknown is bucketed as "other".
function providerOfUrl(url: string): string {
  for (const p of PROVIDER_KEYWORDS) {
    if (url.includes(p.host)) return p.id;
  }
  return "other";
}

/**
 * Build the master answer sheet from the current signal set (already
 * deduped/consolidated by the orchestrator). Entries are sorted masteryScore
 * desc so the UI can take the top N directly.
 */
export function buildMasterySheet(signals: Signal[]): MasteryEntry[] {
  const byKey = new Map<string, Signal[]>();
  for (const s of signals) {
    if (!s.dedupeKey) continue;
    const arr = byKey.get(s.dedupeKey) || [];
    arr.push(s);
    byKey.set(s.dedupeKey, arr);
  }

  const entries: MasteryEntry[] = [];
  for (const [key, group] of byKey) {
    // Each corroborating URL + the primary url are both attributable to a
    // provider. Deduplicate by URL, then de-dedupe providers per URL.
    const primary = group[0];
    const allUrls = [primary.url, ...primary.corroboratingUrls];
    const uniqueUrls = Array.from(new Set(allUrls));
    const sources = uniqueUrls.map((url) => ({
      provider: providerOfUrl(url),
      domain: safeDomain(url),
      tier: primary.sourceTier,
      url,
    }));
    const providers = new Set(sources.map((s) => s.provider));
    const minTier = sources.reduce((m, s) => Math.min(m, s.tier) as SourceTier, 4 as SourceTier);

    const verdict: ConvergenceVerdict =
      providers.size >= 3 ? "strong" :
      providers.size === 2 ? "moderate" :
      providers.size === 1 && minTier <= 2 ? "single" : "noise";

    const masteryScore = computeMasteryScore({
      providerCount: providers.size,
      sourceCount: sources.length,
      minTier,
      hasMultipleCities: group.length > 1, // placeholder — keep simple
    });

    entries.push({
      dedupeKey: key,
      topic: humaniseTopic(key),
      sources,
      sourceCount: sources.length,
      providerCount: providers.size,
      minTier,
      masteryScore,
      verdict,
      firstSeen: primary.firstDetectedAt,
      lastUpdatedAt: primary.lastUpdatedAt,
      primarySignalId: primary.id,
    });
  }

  return entries.sort((a, b) => b.masteryScore - a.masteryScore);
}

function computeMasteryScore(p: { providerCount: number; sourceCount: number; minTier: SourceTier; hasMultipleCities: boolean }): number {
  // Weighted blend: provider diversity dominates; per-source count adds depth
  // but caps at 5 sources (anything more is the same story rehashed).
  const providerComponent = Math.min(p.providerCount, 4) * 25;     // 0/25/50/75/100
  const sourceComponent = Math.min(p.sourceCount, 5) * 4;          // 0..20
  const tierComponent = (4 - p.minTier) * 5;                        // tier 1 => 15, tier 4 => 0
  const cityBonus = p.hasMultipleCities ? 5 : 0;
  return Math.min(100, providerComponent + sourceComponent + tierComponent + cityBonus);
}

function safeDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "unknown"; }
}

function humaniseTopic(dedupeKey: string): string {
  const [brand, city, trend] = dedupeKey.split("|");
  return [brand, city, trend].filter(Boolean).join(" · ");
}
