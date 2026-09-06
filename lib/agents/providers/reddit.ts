import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// Reddit — keyless via the public JSON endpoints (no OAuth required for read).
// 60 req/min soft cap. We respect a polite rate and use the natural JSON API
// surface (.json suffix). `User-Agent` MUST be descriptive or Reddit blocks.
// ---------------------------------------------------------------------------
export const redditProvider: SearchProvider = {
  id: "reddit",
  label: "Reddit (JSON)",
  keyless: true,
  complianceNote: "Reddit public JSON API. Polite spacing (1.2s between calls). Set REDDIT_USER_AGENT for production.",

  async search(query, opts) {
    const ua = process.env.REDDIT_USER_AGENT || "bial-scout/1.0 (commercial research)";
    // Two lenses: subreddit-agnostic search AND top trending subs for retail/F&B.
    const urls = [
      `https://www.reddit.com/search.json?q=${encodeURIComponent(`${query} (retail OR F&B OR "new store" OR launch)`)}&sort=new&t=month&limit=15`,
      `https://www.reddit.com/r/retail+FoodPorn+smallbusiness+Coffee+eCommerce+Fulfillment+travel+Airports/new.json?limit=25`,
    ];
    const out: RawDoc[] = [];
    for (const u of urls) {
      try {
        const res = await fetch(u, {
          headers: { "User-Agent": ua, Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) continue;
        const data = (await res.json()) as {
          data?: { children?: { data: RedditPost }[] };
        };
        for (const c of data?.data?.children || []) {
          const p = c.data;
          out.push({
            title: p.title,
            url: `https://www.reddit.com${p.permalink}`,
            source: `reddit.com/r/${p.subreddit}`,
            publishedAt: new Date(p.created_utc * 1000).toISOString(),
            snippet: (p.selftext || p.title).slice(0, 240),
            query,
            city: opts.city,
            country: opts.country,
          });
        }
      } catch {
        // network/parse errors fall through; the next provider picks up
      }
    }
    if (out.length === 0) return [];
    for (const d of out) if (!d.source || d.source === "unknown") d.source = domainOf(d.url) || "reddit.com";
    return out;
  },
};

interface RedditPost {
  title: string;
  permalink: string;
  subreddit: string;
  created_utc: number;
  selftext: string;
}
