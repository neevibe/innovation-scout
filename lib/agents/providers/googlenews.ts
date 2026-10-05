import type { RawDoc, SearchProvider } from "./types";
import { stripHtml, domainOf } from "./types";

// ---------------------------------------------------------------------------
// Google News RSS — keyless. DEV/DEMO DEFAULT ONLY.
// ⚠ Google's RSS ToS restricts use to personal feed-reader rendering. For a
// production/commercial deployment, switch to a licensed provider (Tavily,
// NewsAPI, Bing News) via SCOUT_SEARCH_PROVIDER. Kept as the zero-config
// default so `SCOUT_MODE=live` produces real fresh signals out of the box.
// ---------------------------------------------------------------------------
export const googleNewsProvider: SearchProvider = {
  id: "googlenews",
  label: "Google News RSS",
  keyless: true,
  complianceNote:
    "Dev/demo only — Google News RSS ToS restricts non-feed-reader use. Use a licensed provider in production.",

  async search(query, { city, country, timespanMonths }) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      `${query} when:${timespanMonths * 30}d`
    )}&hl=en-IN&gl=IN&ceid=IN:en`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BIAL-Scout/0.1)" },
      // don't cache — we want fresh signals
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`google news ${res.status}`);
    const xml = await res.text();
    return parseRss(xml, query, city, country).slice(0, 12);
  },
};

function parseRss(xml: string, query: string, city: string, country: string): RawDoc[] {
  const items = xml.split(/<item>/).slice(1);
  const docs: RawDoc[] = [];
  for (const raw of items) {
    const block = raw.split(/<\/item>/)[0];
    const title = stripHtml(pick(block, "title"));
    let link = stripHtml(pick(block, "link"));
    const pubDate = pick(block, "pubDate");
    const sourceTag = stripHtml(pick(block, "source"));
    const desc = stripHtml(pick(block, "description"));
    if (!title || !link) continue;
    docs.push({
      title,
      url: link,
      source: sourceTag || domainOf(link),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      snippet: desc.slice(0, 400),
      query,
      city,
      country,
    });
  }
  return docs;
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1] : "";
}
