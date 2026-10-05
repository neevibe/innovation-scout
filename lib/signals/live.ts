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
  // Google News is the keyless dev fallback. Bluesky, Mastodon, Lemmy and HN
  // are open APIs; Reddit and YouTube join when their free keys are set.
  const { signals, meta } = await collectSignalsDetailed({
    providerIds: [
      process.env.TAVILY_API_KEY ? "tavily" : "googlenews",
      // Social layer — official/open APIs that are safe to run in production.
      // Priority platforms first: Instagram, Facebook, YouTube (official APIs,
      // active once their free keys are set — see docs/SOCIAL_SETUP.md).
      ...(process.env.META_ACCESS_TOKEN && process.env.IG_USER_ID ? ["instagram"] : []),
      ...(process.env.META_ACCESS_TOKEN ? ["facebook"] : []),
      ...(process.env.YOUTUBE_API_KEY ? ["youtube"] : []),
      "bluesky",
      "mastodon",
      "lemmy",
      "hackernews",
      ...(process.env.REDDIT_CLIENT_ID ? ["reddit"] : []),
    ],
  });
  // Don't cache a failed pass for six hours — throw so the next request retries.
  console.log(`[live-signals] live=${meta.live} queries=${meta.queriesRun} docs=${meta.docsFound} signals=${signals.length} failed=${meta.failedProviders.join(",") || "none"}`);
  // Only cache a genuine live pass. Throwing keeps an offline or failed result
  // out of the shared cache, so the next request simply retries.
  if (!meta.live) throw new Error("live mode is off (SCOUT_MODE)");
  if (meta.failedProviders.includes("*") || signals.length === 0) throw new Error("live collection failed");
  const { consolidated } = consolidate(signals);
  const NOISE = /trip report|things to do|itinerary|travel guide|best places to|share price|stock price|\bipo\b/i;
  const recent = consolidated
    .filter((s) => !NOISE.test(`${s.trend} ${s.description}`))
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, MAX_SIGNALS)
    .map((s) => ({ ...s, description: s.description.slice(0, 400) }));
  const feed = {
    collectedAt: new Date().toISOString(),
    live: true,
    providers: meta.providersUsed,
    queries: meta.queriesRun ?? 0,
    docs: meta.docsFound ?? 0,
    failed: meta.failedProviders,
    signals: recent,
  };
  console.log(`[live-signals] collected ${signals.length} → ${recent.length} signals, ${(JSON.stringify(feed).length / 1024).toFixed(0)} KB, live=${feed.live}, failed=${meta.failedProviders.join(",")}`);
  return feed;
}

// The Data Cache is shared across deployments: key by environment so a preview
// can never serve (or overwrite) production's feed.
export const getLiveFeed = unstable_cache(collect, ["live-signals-v2", process.env.VERCEL_ENV || "local"], {
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
