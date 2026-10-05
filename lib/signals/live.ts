import { unstable_cache, revalidateTag } from "next/cache";
import { collectSignalsDetailed } from "@/lib/agents/collector";
import { consolidate } from "@/lib/agents";
import type { Signal } from "@/lib/types";

// ---------------------------------------------------------------------------
// Live signal feed for /signals.
// The store on Vercel is per-instance temp disk, so signals collected by the
// cron never reach the page. Instead the live collection is kept in Next's
// Data Cache, which is shared across instances and survives deploys of the
// same build: the first request after expiry serves the cached feed and
// re-collects in the background (stale-while-revalidate).
// ---------------------------------------------------------------------------

export interface LiveFeed {
  collectedAt: string;
  live: boolean;
  providers: string[];
  queries: number;
  docs: number;
  failed: string[];
  signals: Signal[];
}

const MAX_SIGNALS = 150; // Data Cache entries are capped at 2 MB

async function collect(): Promise<LiveFeed> {
  // Fast HTTP providers only — the subprocess scrapers (scrapling, X, …) are
  // too slow for a page request. Tavily is licensed for production use;
  // Google News is the keyless dev fallback.
  const { signals, meta } = await collectSignalsDetailed({
    providerIds: [process.env.TAVILY_API_KEY ? "tavily" : "googlenews"],
  });
  // Don't cache a failed pass for six hours — throw so the next request retries.
  if (meta.live && (meta.failedProviders.includes("*") || signals.length === 0)) throw new Error("live collection failed");
  const { consolidated } = consolidate(signals);
  const recent = consolidated
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, MAX_SIGNALS)
    .map((s) => ({ ...s, description: s.description.slice(0, 400) }));
  const feed = {
    collectedAt: new Date().toISOString(),
    live: meta.live && !meta.failedProviders.includes("*"),
    providers: meta.providersUsed,
    queries: meta.queriesRun ?? 0,
    docs: meta.docsFound ?? 0,
    failed: meta.failedProviders,
    signals: recent,
  };
  console.log(`[live-signals] collected ${signals.length} → ${recent.length} signals, ${(JSON.stringify(feed).length / 1024).toFixed(0)} KB, live=${feed.live}, failed=${meta.failedProviders.join(",")}`);
  return feed;
}

export const getLiveFeed = unstable_cache(collect, ["live-signals-v1"], {
  revalidate: 6 * 3600,
  tags: ["live-signals"],
});

/** Called by the refresh cron so the feed is re-collected on schedule. */
export function expireLiveFeed() {
  revalidateTag("live-signals");
}

export function stamp(s: Signal): number {
  return new Date(s.publishedAt || s.firstDetectedAt).getTime() || 0;
}
