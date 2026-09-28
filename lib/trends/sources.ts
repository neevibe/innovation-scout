import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { stripHtml } from "@/lib/agents/providers/types";

// ---------------------------------------------------------------------------
// Platform connectors for Trend Intelligence. Each returns null when it cannot
// measure (missing credentials / blocked) so the UI shows "not connected"
// rather than a guessed number.
// ---------------------------------------------------------------------------

const UA = process.env.SCOUT_USER_AGENT || "bial-innovation-scout/1.0 (trend research; contact via BIAL)";
const DAY = 86_400_000;

async function getText(url: string, init: RequestInit = {}, timeoutMs = 25_000): Promise<string | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal, headers: { "User-Agent": UA, ...(init.headers || {}) }, cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// --- Search interest proxy: Wikipedia daily pageviews ------------------------
// Google Trends has no public API (the explore endpoint returns HTTP 429 to
// scripted clients). Wikipedia pageviews are an open, daily, comparable proxy
// for "people actively looking this up".
export async function wikipediaDaily(title: string, days = 90): Promise<number[] | null> {
  const end = new Date(Date.now() - DAY);
  const start = new Date(end.getTime() - (days - 1) * DAY);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title.replace(/ /g, "_"))}/daily/${fmt(start)}/${fmt(end)}`;
  let txt: string | null = null;
  for (let attempt = 0; attempt < 4 && !txt; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500 * attempt)); // Wikimedia rate-limits bursts
    txt = await getText(url);
  }
  if (!txt) return null;
  try {
    const items = (JSON.parse(txt).items || []) as { views: number }[];
    return items.length ? items.map((i) => i.views) : null;
  } catch {
    return null;
  }
}

// --- News / web: Google News RSS, per regional edition ----------------------
export const NEWS_EDITIONS = {
  IN: "hl=en-IN&gl=IN&ceid=IN:en",
  SG: "hl=en-SG&gl=SG&ceid=SG:en",
  GB: "hl=en-GB&gl=GB&ceid=GB:en",
  US: "hl=en-US&gl=US&ceid=US:en",
} as const;
export type Edition = keyof typeof NEWS_EDITIONS;

export interface NewsItem { title: string; url: string; source?: string; date: string }

export async function googleNews(q: string, edition: Edition, whenDays: number): Promise<NewsItem[] | null> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:${whenDays}d`)}&${NEWS_EDITIONS[edition]}`;
  const xml = await getText(url);
  if (!xml) return null;
  const out: NewsItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const pick = (tag: string) => stripHtml(b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] || "");
    const date = pick("pubDate");
    out.push({ title: pick("title"), url: pick("link"), source: pick("source"), date: date ? new Date(date).toISOString() : "" });
  }
  return out;
}

// --- Google Trends "Trending now" (daily trending searches RSS) --------------
export interface DailyTrend { title: string; traffic?: string; news?: string; url?: string; at?: string }

export async function googleTrendingNow(geo: string): Promise<DailyTrend[] | null> {
  const xml = await getText(`https://trends.google.com/trending/rss?geo=${geo}`);
  if (!xml) return null;
  const out: DailyTrend[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const pick = (tag: string) => stripHtml(b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] || "");
    out.push({
      title: pick("title"),
      traffic: pick("ht:approx_traffic") || undefined,
      news: pick("ht:news_item_title") || undefined,
      url: pick("ht:news_item_url") || undefined,
      at: pick("pubDate") ? new Date(pick("pubDate")).toISOString() : undefined,
    });
  }
  return out;
}

// --- YouTube ---------------------------------------------------------------
// 1) YouTube Data API when YOUTUBE_API_KEY is set (official, production).
// 2) Otherwise yt-dlp from the Agent Reach install (keyless, local collector).
export interface YtWindow { count: number; views: number; top: { title: string; url: string; views: number; channel?: string }[] }

function ytdlpPath(): string | null {
  const candidates = [process.env.YTDLP_PATH, join(homedir(), "venvs/agent-reach/bin/yt-dlp"), "/opt/homebrew/bin/yt-dlp", "/usr/local/bin/yt-dlp"].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p)) || null;
}

function ytdlpSearch(bin: string, q: string, sp: string): Promise<YtWindow | null> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=${sp}`;
  return new Promise((resolve) => {
    execFile(bin, ["--flat-playlist", "-j", "--playlist-end", "50", url], { timeout: 120_000, maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err && !stdout) return resolve(null);
      const rows = stdout.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) as { title: string; url: string; view_count?: number; channel?: string }[];
      const top = [...rows].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3).map((r) => ({ title: r.title, url: r.url, views: r.view_count || 0, channel: r.channel }));
      resolve({ count: rows.length, views: rows.reduce((s, r) => s + (r.view_count || 0), 0), top });
    });
  });
}

async function ytApiWindow(key: string, q: string, days: number): Promise<YtWindow | null> {
  const after = new Date(Date.now() - days * DAY).toISOString();
  const s = await getText(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&order=viewCount&publishedAfter=${after}&q=${encodeURIComponent(q)}&key=${key}`);
  if (!s) return null;
  const ids = (JSON.parse(s).items || []).map((i: { id: { videoId: string } }) => i.id.videoId).join(",");
  if (!ids) return { count: 0, views: 0, top: [] };
  const v = await getText(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${key}`);
  if (!v) return null;
  const rows = (JSON.parse(v).items || []).map((i: { id: string; snippet: { title: string; channelTitle: string }; statistics: { viewCount?: string } }) => ({ title: i.snippet.title, url: `https://www.youtube.com/watch?v=${i.id}`, views: Number(i.statistics.viewCount || 0), channel: i.snippet.channelTitle }));
  rows.sort((a: { views: number }, b: { views: number }) => b.views - a.views);
  return { count: rows.length, views: rows.reduce((s: number, r: { views: number }) => s + r.views, 0), top: rows.slice(0, 3) };
}

export function youtubeMode(): { mode: "live" | "disconnected"; label: string } {
  if (process.env.YOUTUBE_API_KEY) return { mode: "live", label: "YouTube Data API v3" };
  if (ytdlpPath()) return { mode: "live", label: "YouTube search via yt-dlp (Agent Reach)" };
  return { mode: "disconnected", label: "YouTube" };
}

export async function youtube(q: string): Promise<{ week: YtWindow; month: YtWindow } | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const [week, month] = await Promise.all([ytApiWindow(key, q, 7), ytApiWindow(key, q, 30)]);
    return week && month ? { week, month } : null;
  }
  const bin = ytdlpPath();
  if (!bin) return null;
  // sp filters: EgQIAxAB = uploaded this week (videos), EgQIBBAB = this month.
  const week = await ytdlpSearch(bin, q, "EgQIAxAB");
  const month = await ytdlpSearch(bin, q, "EgQIBBAB");
  return week && month ? { week, month } : null;
}

// --- Reddit (OAuth app-only; public JSON is blocked for scripted clients) ---
export const redditConnected = () => Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);

let redditToken: { token: string; exp: number } | null = null;
async function redditAuth(): Promise<string | null> {
  if (redditToken && redditToken.exp > Date.now()) return redditToken.token;
  const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const txt = await getText("https://www.reddit.com/api/v1/access_token", { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!txt) return null;
  const j = JSON.parse(txt);
  redditToken = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return redditToken.token;
}

export async function reddit(q: string): Promise<{ week: number; month: number; score: number; top: { title: string; url: string; score: number }[] } | null> {
  if (!redditConnected()) return null;
  const tok = await redditAuth();
  if (!tok) return null;
  const run = async (t: "week" | "month") => {
    const txt = await getText(`https://oauth.reddit.com/search?q=${encodeURIComponent(q)}&t=${t}&sort=top&limit=100`, { headers: { Authorization: `Bearer ${tok}` } });
    return txt ? ((JSON.parse(txt).data?.children || []) as { data: { title: string; permalink: string; score: number } }[]).map((c) => c.data) : null;
  };
  const [w, m] = [await run("week"), await run("month")];
  if (!w || !m) return null;
  return { week: w.length, month: m.length, score: m.reduce((s, p) => s + p.score, 0), top: m.sort((a, b) => b.score - a.score).slice(0, 3).map((p) => ({ title: p.title, url: `https://www.reddit.com${p.permalink}`, score: p.score })) };
}

// --- X / Twitter (API v2 recent counts — needs a paid-tier bearer token) ----
export const xConnected = () => Boolean(process.env.X_BEARER_TOKEN);

export async function xCounts(q: string): Promise<{ last2d: number; prev5d: number; total7d: number } | null> {
  if (!xConnected()) return null;
  const txt = await getText(`https://api.x.com/2/tweets/counts/recent?granularity=day&query=${encodeURIComponent(`${q} -is:retweet`)}`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } });
  if (!txt) return null;
  const days = ((JSON.parse(txt).data || []) as { tweet_count: number }[]).map((d) => d.tweet_count);
  const last2d = days.slice(-2).reduce((a, b) => a + b, 0);
  const prev5d = days.slice(0, -2).reduce((a, b) => a + b, 0);
  return { last2d, prev5d, total7d: last2d + prev5d };
}

// --- Instagram (Graph API hashtag search — needs a Business account) -------
export const instagramConnected = () => Boolean(process.env.IG_USER_ID && process.env.META_ACCESS_TOKEN);

export async function instagramHashtag(q: string): Promise<{ recent24h: number; topEngagement: number } | null> {
  if (!instagramConnected()) return null;
  const tag = q.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const base = "https://graph.facebook.com/v21.0";
  const auth = `access_token=${process.env.META_ACCESS_TOKEN}`;
  const s = await getText(`${base}/ig_hashtag_search?user_id=${process.env.IG_USER_ID}&q=${tag}&${auth}`);
  const id = s ? JSON.parse(s).data?.[0]?.id : null;
  if (!id) return null;
  const [recent, top] = await Promise.all([
    getText(`${base}/${id}/recent_media?user_id=${process.env.IG_USER_ID}&fields=id&limit=50&${auth}`),
    getText(`${base}/${id}/top_media?user_id=${process.env.IG_USER_ID}&fields=like_count,comments_count&limit=50&${auth}`),
  ]);
  const recentN = recent ? (JSON.parse(recent).data || []).length : 0;
  const eng = top ? ((JSON.parse(top).data || []) as { like_count?: number; comments_count?: number }[]).reduce((s2, m) => s2 + (m.like_count || 0) + (m.comments_count || 0), 0) : 0;
  return { recent24h: recentN, topEngagement: eng };
}
