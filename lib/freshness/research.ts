import { stripHtml, domainOf } from "@/lib/agents/providers/types";

// ---------------------------------------------------------------------------
// Freshness Agent — research layer.
// Tavily (licensed, keyed — production) when TAVILY_API_KEY is set; Google
// News RSS (keyless, dev/demo only — see googlenews.ts ToS note) otherwise.
// Tavily also returns public images for the query, which the image resolver
// uses as one of its candidate sources.
// ---------------------------------------------------------------------------

export interface NewsDoc {
  title: string;
  url: string;
  publisher: string;
  publishedAt?: string; // ISO
  snippet: string;
  query: string;
}

export interface NewsResult {
  docs: NewsDoc[];
  images: string[]; // public image URLs Tavily associated with the query
  provider: "tavily" | "googlenews";
}

const UA = "Mozilla/5.0 (compatible; BIAL-Scout-Freshness/1.0)";

export async function newsSearch(query: string, days = 14): Promise<NewsResult> {
  if (process.env.TAVILY_API_KEY) {
    try {
      return await tavily(query, days);
    } catch {
      /* fall through to keyless */
    }
  }
  return googleNews(query, days);
}

async function tavily(query: string, days: number): Promise<NewsResult> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      topic: "news",
      search_depth: "basic",
      days,
      max_results: 8,
      include_images: true,
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  const data = (await res.json()) as {
    results?: { title: string; url: string; content?: string; published_date?: string }[];
    images?: (string | { url: string })[];
  };
  return {
    provider: "tavily",
    images: (data.images || []).map((i) => (typeof i === "string" ? i : i.url)).filter(Boolean),
    docs: (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      publisher: domainOf(r.url),
      publishedAt: r.published_date ? new Date(r.published_date).toISOString() : undefined,
      snippet: (r.content || "").slice(0, 400),
      query,
    })),
  };
}

async function googleNews(query: string, days: number): Promise<NewsResult> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${days}d`)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`google news ${res.status}`);
  const xml = await res.text();
  const docs: NewsDoc[] = [];
  for (const raw of xml.split(/<item>/).slice(1)) {
    const block = raw.split(/<\/item>/)[0];
    const rawTitle = stripHtml(pick(block, "title"));
    const link = stripHtml(pick(block, "link"));
    const publisher = stripHtml(pick(block, "source"));
    const pub = pick(block, "pubDate");
    if (!rawTitle || !link) continue;
    // Google appends " - Publisher" to every title; drop it.
    const title = publisher && rawTitle.endsWith(` - ${publisher}`) ? rawTitle.slice(0, -publisher.length - 3) : rawTitle;
    docs.push({
      title,
      url: link,
      publisher: (publisher || domainOf(link)).replace(/[\s\-–]+$/, ""),
      publishedAt: pub ? new Date(pub).toISOString() : undefined,
      // Google's description is just the linked title again — no extra signal.
      snippet: "",
      query,
    });
  }
  return { provider: "googlenews", images: [], docs: docs.slice(0, 10) };
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1] : "";
}

export function ageDays(iso?: string, now = Date.now()): number {
  if (!iso) return 99;
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86400000));
}

export function ageLabel(iso?: string): string {
  const d = ageDays(iso);
  return d === 0 ? "TODAY" : d === 1 ? "1 DAY AGO" : `${d} DAYS AGO`;
}

/**
 * Google News RSS links are opaque redirects (news.google.com/rss/articles/…).
 * Resolve one to the publisher's real article URL so readers land on the source
 * and the image resolver can read the publisher's own og:image. Best-effort:
 * returns the original link on any failure.
 */
export async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!/news\.google\.com\/rss\/articles\//.test(url)) return url;
  try {
    const id = new URL(url).pathname.split("/").pop()!;
    const page = await fetch(`https://news.google.com/rss/articles/${id}`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    const html = await page.text();
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sg || !ts) return url;
    const inner = JSON.stringify([
      "garturlreq",
      [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
      id,
      Number(ts),
      sg,
    ]);
    const res = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "Mozilla/5.0" },
      body: "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]])),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const m = (await res.text()).match(/garturlres\\",\\"(https?:[^"\\]+)/);
    return m ? m[1] : url;
  } catch {
    return url;
  }
}
