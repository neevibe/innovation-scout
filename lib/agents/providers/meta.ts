import type { RawDoc, SearchProvider } from "./types";
import { WATCHLIST, CITY_HASHTAGS, GLOBAL_HASHTAGS } from "@/lib/data/socialWatchlist";

// ---------------------------------------------------------------------------
// Instagram + Facebook via Meta's official Graph API (free).
// Needs META_ACCESS_TOKEN (long-lived user or system-user token) and, for
// Instagram, IG_USER_ID (your Instagram Business account id). Setup steps:
// docs/SOCIAL_SETUP.md.
//   Instagram — Hashtag Search (recent_media / top_media) + Business Discovery
//               (public metrics + latest posts of the brand watchlist).
//   Facebook  — Page posts of the watchlist (needs the "Page Public Content
//               Access" feature approved on the Meta app; skipped otherwise).
// Each provider runs once per city (maxLenses 1) to stay inside rate limits.
// ---------------------------------------------------------------------------

const GRAPH = "https://graph.facebook.com/v21.0";
const DAY = 86400000;

async function graph<T>(path: string): Promise<T | null> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${token}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const fmt = (n?: number) => (n == null ? "?" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
const recent = (iso: string | undefined, days: number) => !!iso && Date.now() - new Date(iso).getTime() < days * DAY;

interface IgMedia {
  caption?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

const hashtagIds = new Map<string, string>();

export const instagramProvider: SearchProvider = {
  id: "instagram",
  label: "Instagram (Graph API)",
  keyless: false,
  fallback: false,
  maxLenses: 1,
  complianceNote: "Meta Instagram Graph API — Hashtag Search + Business Discovery (official).",
  async search(query, opts) {
    const ig = process.env.IG_USER_ID;
    if (!ig || !process.env.META_ACCESS_TOKEN) return [];
    const days = opts.timespanMonths * 30;
    const out: RawDoc[] = [];
    const push = (m: IgMedia, source: string, lead: string) => {
      const caption = (m.caption || "").replace(/\s+/g, " ").trim();
      if (!recent(m.timestamp, days) || caption.length < 20) return;
      out.push({
        title: `${lead}: ${caption.slice(0, 110)}`,
        url: m.permalink,
        source,
        publishedAt: m.timestamp,
        snippet: `${caption.slice(0, 320)} · ${fmt(m.like_count)} likes · ${fmt(m.comments_count)} comments`,
        query,
        city: opts.city,
        country: opts.country,
      });
    };

    // 1. Brand watchlist — Business Discovery: followers + latest posts.
    for (const w of WATCHLIST.filter((b) => b.city === opts.city && b.instagram)) {
      const d = await graph<{ business_discovery?: { followers_count?: number; media?: { data: IgMedia[] } } }>(
        `${ig}?fields=business_discovery.username(${w.instagram}){followers_count,media.limit(6){caption,permalink,timestamp,like_count,comments_count}}`
      );
      const bd = d?.business_discovery;
      for (const m of bd?.media?.data || []) push(m, `instagram.com/${w.instagram}`, `${w.brand} (${fmt(bd?.followers_count)} followers)`);
    }

    // 2. Hashtags — the city's own tags (+ global travel-retail tags on the first city).
    const tags = [...(CITY_HASHTAGS[opts.city] || []), ...(opts.city === Object.keys(CITY_HASHTAGS)[0] ? GLOBAL_HASHTAGS : [])];
    for (const tag of tags) {
      let id = hashtagIds.get(tag);
      if (!id) {
        const s = await graph<{ data?: { id: string }[] }>(`ig_hashtag_search?user_id=${ig}&q=${tag}`);
        id = s?.data?.[0]?.id;
        if (!id) continue;
        hashtagIds.set(tag, id);
      }
      const top = await graph<{ data?: IgMedia[] }>(`${id}/top_media?user_id=${ig}&fields=caption,permalink,timestamp,like_count,comments_count&limit=25`);
      const top5 = (top?.data || []).filter((m) => recent(m.timestamp, days)).sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 5);
      for (const m of top5) push(m, `instagram.com/explore/tags/${tag}`, `#${tag}`);
    }
    return out;
  },
};

export const facebookProvider: SearchProvider = {
  id: "facebook",
  label: "Facebook Pages (Graph API)",
  keyless: false,
  fallback: false,
  maxLenses: 1,
  complianceNote: "Meta Graph API Page posts — requires the Page Public Content Access feature.",
  async search(query, opts) {
    if (!process.env.META_ACCESS_TOKEN) return [];
    const out: RawDoc[] = [];
    for (const w of WATCHLIST.filter((b) => b.city === opts.city && b.facebook)) {
      const d = await graph<{ fan_count?: number; posts?: { data: { message?: string; created_time: string; permalink_url: string; reactions?: { summary?: { total_count?: number } } }[] } }>(
        `${w.facebook}?fields=fan_count,posts.limit(5){message,created_time,permalink_url,reactions.summary(true)}`
      );
      for (const p of d?.posts?.data || []) {
        const msg = (p.message || "").replace(/\s+/g, " ").trim();
        if (!recent(p.created_time, opts.timespanMonths * 30) || msg.length < 20) continue;
        out.push({
          title: `${w.brand} (${fmt(d?.fan_count)} followers): ${msg.slice(0, 110)}`,
          url: p.permalink_url,
          source: `facebook.com/${w.facebook}`,
          publishedAt: p.created_time,
          snippet: `${msg.slice(0, 320)} · ${fmt(p.reactions?.summary?.total_count)} reactions`,
          query,
          city: opts.city,
          country: opts.country,
        });
      }
    }
    return out;
  },
};
