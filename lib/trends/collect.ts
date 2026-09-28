import { TREND_CATALOG } from "./catalog";
import { emptyReading, scoreCohort, type Draft } from "./score";
import {
  googleNews, googleTrendingNow, instagramConnected, instagramHashtag, reddit, redditConnected,
  wikipediaDaily, xConnected, xCounts, youtube, youtubeMode, type Edition, type NewsItem,
} from "./sources";
import type { EvidenceItem, PlatformId, PlatformStatus, TrendDefinition, TrendingNowItem, TrendSnapshot } from "./types";

const DAY = 86_400_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

export function platformStatuses(): PlatformStatus[] {
  const yt = youtubeMode();
  return [
    { id: "instagram", label: "Instagram", mode: instagramConnected() ? "live" : "disconnected", sourceLabel: "Instagram Graph API — hashtag search", howToConnect: "Set IG_USER_ID + META_ACCESS_TOKEN (Instagram Business account). Agent Reach: `opencli instagram` via a logged-in browser session." },
    { id: "x", label: "X", mode: xConnected() ? "live" : "disconnected", sourceLabel: "X API v2 — recent tweet counts", howToConnect: "Set X_BEARER_TOKEN (Basic tier or above). Agent Reach: `agent-reach configure twitter-cookies` + twitter-cli." },
    { id: "facebook", label: "Facebook", mode: "disconnected", sourceLabel: "No public trends API", howToConnect: "Meta retired CrowdTangle (Aug 2024); Meta Content Library is researcher-only. Agent Reach `opencli facebook` can read pages/groups with a logged-in session." },
    { id: "search", label: "Search", mode: "proxy", sourceLabel: "Wikipedia daily pageviews (Google Trends has no public API)", howToConnect: "For true Google Trends numbers, add a SerpApi / DataForSEO key." },
    { id: "youtube", label: "YouTube", mode: yt.mode, sourceLabel: yt.label, howToConnect: "Set YOUTUBE_API_KEY, or install yt-dlp (bundled with Agent Reach)." },
    { id: "reddit", label: "Reddit", mode: redditConnected() ? "live" : "disconnected", sourceLabel: "Reddit OAuth (app-only) search", howToConnect: "Public JSON now returns 403. Create a Reddit 'script' app and set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET." },
    { id: "news", label: "News / Web", mode: "live", sourceLabel: "Google News RSS — global + India- and Asia-scoped queries" },
  ];
}

const within = (items: NewsItem[], days: number) => items.filter((i) => i.date && Date.now() - Date.parse(i.date) <= days * DAY).length;

async function measure(def: TrendDefinition, log: (s: string) => void): Promise<Draft> {
  const platforms = Object.fromEntries((["instagram", "x", "facebook", "search", "youtube", "reddit", "news"] as PlatformId[]).map((p) => [p, emptyReading()])) as Draft["platforms"];
  const rawIntensity: Draft["rawIntensity"] = {};
  const rawVelocity: Draft["rawVelocity"] = {};
  const evidence: EvidenceItem[] = [];
  const q = `"${def.query}"`;

  // Search proxy — Wikipedia 90-day series.
  const series = def.wiki ? (await wikipediaDaily(def.wiki, 90)) || [] : [];
  if (series.length >= 35) {
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
    const last7 = avg(series.slice(-7));
    const base = avg(series.slice(-35, -7));
    rawIntensity.search = avg(series.slice(-30));
    rawVelocity.search = base > 0 ? last7 / base : null;
    platforms.search.raw = { avgDaily30d: Math.round(rawIntensity.search), last7avg: Math.round(last7), prior28avg: Math.round(base) };
  }

  // News — Google News editions return near-identical results for a quoted
  // query, so geography comes from place-scoped queries instead. Each scope is
  // read over 7 days (reach) and 1 day (velocity). The RSS caps a query at 100
  // items; a saturated scope is excluded from velocity, never read as a spike.
  const scopes: { key: "global" | "india" | "asia"; q: string; ed: Edition }[] = [
    { key: "global", q, ed: "US" },
    { key: "india", q: `${q} (India OR Mumbai OR Delhi OR Bengaluru OR Bangalore OR Hyderabad OR Chennai)`, ed: "IN" },
    { key: "asia", q: `${q} (Singapore OR Japan OR Korea OR Thailand OR "Hong Kong" OR Dubai OR China)`, ed: "SG" },
  ];
  const week: Partial<Record<string, NewsItem[] | null>> = {};
  let v1 = 0, v7 = 0;
  for (const s of scopes) {
    week[s.key] = await googleNews(s.q, s.ed, 7);
    await sleep(300);
    const day = await googleNews(s.q, s.ed, 1);
    await sleep(300);
    const c7 = week[s.key]?.length ?? 0;
    if (day && c7 > 0 && c7 < 95) {
      v1 += day.length;
      v7 += c7;
    }
  }
  const blrNews = await googleNews(`${q} (Bengaluru OR Bangalore)`, "IN", 90);
  const all = week.global || [];
  if (week.global) {
    rawIntensity.news = all.length;
    rawVelocity.news = v7 > 0 ? (v1 * 7) / v7 : null;
    platforms.news.raw = { items7d: all.length, items1d_unsaturated: v1, items7d_unsaturated: v7, last48h: within(all, 2) };
    const seen = new Set<string>();
    for (const it of [...all].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))) {
      if (seen.has(it.title) || evidence.filter((x) => x.platform === "news").length >= 4) continue;
      seen.add(it.title);
      evidence.push({ platform: "news", title: it.title, url: it.url, source: it.source, date: it.date });
    }
  }
  const len = (k: string) => (week[k] ? (week[k] as NewsItem[]).length : null);
  const geoRaw = { global: len("global"), india: len("india"), asia: len("asia"), bengaluru: blrNews ? blrNews.length : null };

  // YouTube — this week vs this month.
  const yt = await youtube(def.query);
  if (yt) {
    rawIntensity.youtube = yt.month.views;
    // Thin result sets make week/month ratios meaningless — require a base, then clamp.
    const enough = yt.month.count >= 10 && yt.month.views >= 50_000;
    rawVelocity.youtube = enough ? Math.min(4, Math.max(0.25, (yt.week.views / 7) / (yt.month.views / 30))) : null;
    platforms.youtube.raw = { views7d: yt.week.views, views30d: yt.month.views, videos7d: yt.week.count, videos30d: yt.month.count };
    for (const v of yt.week.top.slice(0, 2)) evidence.push({ platform: "youtube", title: v.title, url: v.url, source: v.channel, metric: `${fmtN(v.views)} views` });
  }

  // Credentialed platforms — only when connected.
  const rd = await reddit(def.query);
  if (rd) {
    rawIntensity.reddit = rd.month + Math.log1p(rd.score);
    rawVelocity.reddit = rd.month > 0 ? (rd.week / 7) / (rd.month / 30) : null;
    platforms.reddit.raw = { posts7d: rd.week, posts30d: rd.month, score30d: rd.score };
    for (const p of rd.top.slice(0, 2)) evidence.push({ platform: "reddit", title: p.title, url: p.url, metric: `${fmtN(p.score)} upvotes` });
  }
  const xc = await xCounts(def.query);
  if (xc) {
    rawIntensity.x = xc.total7d;
    rawVelocity.x = xc.prev5d > 0 ? (xc.last2d / 2) / (xc.prev5d / 5) : null;
    platforms.x.raw = xc;
  }
  const ig = await instagramHashtag(def.query);
  if (ig) {
    rawIntensity.instagram = ig.recent24h * 10 + ig.topEngagement;
    platforms.instagram.raw = ig;
  }

  log(`  ✓ ${def.name.padEnd(28)} wiki=${series.length ? "✓" : "–"} news=${rawIntensity.news ?? "–"} yt=${yt ? fmtN(yt.month.views) : "–"} blr=${geoRaw.bengaluru ?? "–"}`);
  return { ...def, platforms, geo: { global: null, asia: null, india: null, bengaluru: null }, geoRaw, series, evidence, rawIntensity, rawVelocity };
}

export function fmtN(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

// Consumer/commercial vocabulary for tagging Google's raw trending searches.
const COMMERCIAL = /\b(launch|store|sale|iphone|samsung|pixel|brand|coffee|cafe|restaurant|food|beauty|skincare|perfume|fashion|shoe|sneaker|watch|jewel|gold|diamond|travel|flight|airline|airport|hotel|resort|festival|concert|tour|movie|release|trailer|album|game|ps5|nintendo|app|ai|launches|biryani|chocolate|tea|matcha|diwali|navratri|durga|dussehra|offer|toy|labubu|anime|ott|netflix|prime)\b/i;

// Market/finance searches are not consumer-commercial for an airport.
const FINANCE = /\b(share price|stock|ipo|gmp|sensex|nifty|dividend|results|q[1-4] results|mutual fund)\b/i;
export const isCommercial = (text: string) => COMMERCIAL.test(text) && !FINANCE.test(text);

export async function collectTrendingNow(): Promise<TrendingNowItem[]> {
  const geos = ["IN", "SG", "AE", "GB"];
  const out: TrendingNowItem[] = [];
  for (const g of geos) {
    const items = (await googleTrendingNow(g)) || [];
    for (const it of items.slice(0, 12)) {
      out.push({ geo: g, title: it.title, traffic: it.traffic, url: it.url, news: it.news, at: it.at, commercial: isCommercial(`${it.title} ${it.news || ""}`) });
    }
    await sleep(300);
  }
  return out;
}

export async function collectSnapshot(opts: { log?: (s: string) => void; concurrency?: number } = {}): Promise<TrendSnapshot> {
  const log = opts.log || (() => {});
  log(`Measuring ${TREND_CATALOG.length} trends across connected platforms…`);
  const drafts = await pool(TREND_CATALOG, opts.concurrency ?? 2, (d) => measure(d, log));
  const trends = scoreCohort(drafts).sort((a, b) => b.overall - a.overall);
  log("Collecting Google 'Trending now' (IN, SG, AE, GB)…");
  const trendingNow = await collectTrendingNow();
  const platforms = platformStatuses();
  return {
    generatedAt: new Date().toISOString(),
    windowDays: 30,
    collector: `Agent Reach toolchain — ${platforms.filter((p) => p.mode !== "disconnected").map((p) => p.label).join(", ")}`,
    platforms,
    trends,
    trendingNow,
    notes: [
      "Intensity is cohort-relative (log-scaled across all tracked trends), so 100 = strongest tracked trend on that platform, not an absolute volume.",
      "Google News RSS returns at most 100 items per query/edition; very large topics saturate, which compresses the top of the News column.",
      "Search = Wikipedia pageviews as a proxy for search interest. Google Trends' explore endpoint rejects scripted clients (HTTP 429).",
      "Platforms marked 'not connected' show no number — they are never estimated.",
    ],
  };
}
