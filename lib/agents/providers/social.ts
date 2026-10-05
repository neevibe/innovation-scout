import type { RawDoc, SearchProvider } from "./types";
import { stripHtml } from "./types";

// ---------------------------------------------------------------------------
// Keyless social providers that are safe to run in production:
//   Bluesky   — open AT Protocol search API (public AppView)
//   Reddit    — public search RSS (the JSON API now 403s without OAuth)
//   Mastodon  — public hashtag timelines (mastodon.social)
//   Lemmy     — open federated search (lemmy.world)
//   Hacker News — Algolia search API (technology / airport-tech signals)
// Collector queries look like "Dubai new restaurant OR cafe OR F&B concept";
// social search engines don't speak OR, so each provider narrows the query to
// the city plus the lens's leading terms.
// ---------------------------------------------------------------------------

const UA = "bial-innovation-scout/1.0 (+https://innovation-scout.vercel.app)";
const DAY = 86400000;

/** "Dubai new restaurant OR cafe OR F&B concept" → { city:"Dubai", terms:["restaurant","cafe","F&B concept"] } */
function split(query: string, city: string) {
  const lens = query.startsWith(city) ? query.slice(city.length).trim() : query;
  const terms = lens.split(/\s+OR\s+/i).map((t) => t.replace(/^new\s+/i, "").trim()).filter(Boolean);
  return { city: city.replace(/\s+NCR$/i, ""), terms };
}

// Social chatter is mostly noise for the scout: keep posts that talk about a
// brand, venue, product or launch, and drop service ads / listicles.
const COMMERCE = /\b(brand|store|shop|boutique|flagship|outlet|restaurant|caf[eé]|coffee|bakery|bar|menu|launch\w*|opens?|opening|pop-?up|new (?:spot|place|concept)|duty[- ]free|airport|lounge|beauty|skincare|fragrance|sneaker|collab\w*|queue|sold out|must[- ]try)\b/i;
const SPAM = /\b(suppliers?|manufacturers?|call now|whatsapp|dm (?:us|for)|best .{0,30} in \w+ (?:ncr|city)|interior designers?|equipment|sector \d+|commercial kitchen|real estate|plots?|property|loan|casino|escort)\b/i;
const relevant = (text: string) => COMMERCE.test(text) && !SPAM.test(text);

const recent = (iso: string | undefined, days: number) => !iso || Date.now() - new Date(iso).getTime() < days * DAY;

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// --- Bluesky -----------------------------------------------------------------
export const blueskyProvider: SearchProvider = {
  id: "bluesky",
  label: "Bluesky",
  keyless: true,
  fallback: false,
  maxLenses: 3,
  complianceNote: "Bluesky public AppView search API (open AT Protocol) — permitted for programmatic use.",
  async search(query, opts) {
    const { city, terms } = split(query, opts.city);
    const out: RawDoc[] = [];
    for (const term of terms.slice(0, 2)) {
      const data = await getJson<{ posts?: BskyPost[] }>(
        `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(`${city} ${term}`)}&sort=latest&limit=15&lang=en`
      );
      for (const p of data?.posts || []) {
        const text = p.record?.text || "";
        // Engagement floor: a post nobody liked isn't buzz.
        if ((p.likeCount || 0) + (p.repostCount || 0) < 3) continue;
        if (text.length < 40 || !relevant(text) || !recent(p.record?.createdAt, opts.timespanMonths * 30)) continue;
        const rkey = p.uri.split("/").pop();
        out.push({
          title: text.split("\n")[0].slice(0, 140),
          url: `https://bsky.app/profile/${p.author.handle}/post/${rkey}`,
          source: `bsky.app/@${p.author.handle}`,
          publishedAt: p.record?.createdAt,
          snippet: `${text.slice(0, 360)} · ${p.likeCount || 0} likes · ${p.repostCount || 0} reposts`,
          query,
          city: opts.city,
          country: opts.country,
        });
      }
    }
    return out;
  },
};
interface BskyPost {
  uri: string;
  author: { handle: string };
  record?: { text?: string; createdAt?: string };
  likeCount?: number;
  repostCount?: number;
}

// --- Reddit (official API, app-only OAuth) ------------------------------------------
// Anonymous JSON/RSS access is now 403/429-limited, so Reddit runs only when
// free app credentials are set (reddit.com/prefs/apps → "script" app):
//   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
let redditToken: { value: string; exp: number } | null = null;
async function redditAuth(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (redditToken && redditToken.exp > Date.now()) return redditToken.value;
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    redditToken = { value: data.access_token, exp: Date.now() + ((data.expires_in || 3600) - 60) * 1000 };
    return redditToken.value;
  } catch {
    return null;
  }
}

export const redditRssProvider: SearchProvider = {
  id: "reddit",
  label: "Reddit",
  keyless: false,
  fallback: false,
  maxLenses: 3,
  complianceNote: "Reddit official Data API (app-only OAuth, free tier: 100 queries/min).",
  async search(query, opts) {
    const token = await redditAuth();
    if (!token) return [];
    const { city, terms } = split(query, opts.city);
    const q = `${city} (${terms.slice(0, 3).map((t) => `"${t}"`).join(" OR ")})`;
    try {
      const res = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(q)}&sort=new&t=month&type=link&limit=25`, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": UA },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: { children?: { data: { title: string; permalink: string; subreddit: string; created_utc: number; selftext?: string; score: number } }[] } };
      return (data.data?.children || []).map(({ data: p }) => ({
        title: p.title,
        url: `https://www.reddit.com${p.permalink}`,
        source: `reddit.com/r/${p.subreddit}`,
        publishedAt: new Date(p.created_utc * 1000).toISOString(),
        snippet: (p.selftext || p.title).slice(0, 400),
        query,
        city: opts.city,
        country: opts.country,
      }));
    } catch {
      return [];
    }
  },
};

// --- Mastodon ----------------------------------------------------------------------
export const mastodonProvider: SearchProvider = {
  id: "mastodon",
  label: "Mastodon",
  keyless: true,
  fallback: false,
  maxLenses: 1,
  complianceNote: "mastodon.social public hashtag timelines — public, unauthenticated API.",
  async search(query, opts) {
    const { city, terms } = split(query, opts.city);
    const tag = city.toLowerCase().replace(/[^a-z]/g, "");
    const posts = await getJson<MastoStatus[]>(`https://mastodon.social/api/v1/timelines/tag/${tag}?limit=40`);
    const kw = new RegExp(`\\b(${["store", "shop", "restaurant", "cafe", "café", "launch", "opens", "opening", "brand", "airport", "duty free", "pop-up", "lounge", "food", ...terms.map((t) => t.split(" ")[0])].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "i");
    return (posts || [])
      .map((p) => ({ p, text: stripHtml(p.content) }))
      .filter(({ text, p }) => text.length > 40 && kw.test(text) && !SPAM.test(text) && recent(p.created_at, opts.timespanMonths * 30))
      .slice(0, 12)
      .map(({ p, text }) => ({
        title: text.slice(0, 140),
        url: p.url,
        source: `mastodon/@${p.account.acct}`,
        publishedAt: p.created_at,
        snippet: text.slice(0, 400),
        query,
        city: opts.city,
        country: opts.country,
      }));
  },
};
interface MastoStatus {
  url: string;
  content: string;
  created_at: string;
  account: { acct: string };
}

// --- Lemmy ---------------------------------------------------------------------------
export const lemmyProvider: SearchProvider = {
  id: "lemmy",
  label: "Lemmy",
  keyless: true,
  fallback: false,
  maxLenses: 2,
  complianceNote: "lemmy.world public search API (federated, open).",
  async search(query, opts) {
    const { city, terms } = split(query, opts.city);
    const data = await getJson<{ posts?: LemmyPost[] }>(
      `https://lemmy.world/api/v3/search?q=${encodeURIComponent(`${city} ${terms[0] || ""}`)}&type_=Posts&sort=New&limit=15&listing_type=All`
    );
    return (data?.posts || [])
      .filter((p) => recent(p.post.published, opts.timespanMonths * 30) && relevant(`${p.post.name} ${p.post.body || ""}`))
      .map((p) => ({
        title: p.post.name,
        url: p.post.url || p.post.ap_id,
        source: `lemmy/${p.community.name}`,
        publishedAt: p.post.published,
        snippet: (p.post.body || p.post.name).slice(0, 400),
        query,
        city: opts.city,
        country: opts.country,
      }));
  },
};
interface LemmyPost {
  post: { name: string; url?: string; ap_id: string; body?: string; published: string };
  community: { name: string };
}

// --- Hacker News ---------------------------------------------------------------------
export const hackerNewsProvider: SearchProvider = {
  id: "hackernews",
  label: "Hacker News",
  keyless: true,
  fallback: false,
  maxLenses: 1,
  complianceNote: "HN Algolia search API — public, unauthenticated.",
  async search(query, opts) {
    const { city } = split(query, opts.city);
    const since = Math.floor((Date.now() - opts.timespanMonths * 30 * DAY) / 1000);
    const data = await getJson<{ hits?: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(`${city} airport`)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=10`
    );
    return (data?.hits || []).map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "news.ycombinator.com",
      publishedAt: h.created_at,
      snippet: h.title,
      query,
      city: opts.city,
      country: opts.country,
    }));
  },
};
interface HnHit {
  title: string;
  url?: string;
  objectID: string;
  created_at: string;
}

export const SOCIAL_PROVIDERS = [blueskyProvider, redditRssProvider, mastodonProvider, lemmyProvider, hackerNewsProvider];
