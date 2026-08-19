import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// Tavily Search API — keyed. RECOMMENDED FOR PRODUCTION.
// Returns ranked results with content excerpts, licensed for programmatic use.
// Set TAVILY_API_KEY and SCOUT_SEARCH_PROVIDER=tavily (or leave provider unset
// and the selector prefers Tavily whenever the key is present).
// ---------------------------------------------------------------------------
export const tavilyProvider: SearchProvider = {
  id: "tavily",
  label: "Tavily Search",
  keyless: false,
  complianceNote: "Licensed programmatic search — recommended for production.",

  async search(query, { city, country }) {
    const key = process.env.TAVILY_API_KEY;
    if (!key) throw new Error("TAVILY_API_KEY not set");

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        api_key: key,
        query,
        topic: "news",
        search_depth: "basic",
        days: 90,
        max_results: 10,
        include_answer: false,
      }),
    });
    if (!res.ok) throw new Error(`tavily ${res.status}`);
    const data = (await res.json()) as { results?: TavilyResult[] };
    return (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      source: domainOf(r.url),
      publishedAt: r.published_date ? new Date(r.published_date).toISOString() : undefined,
      snippet: (r.content || "").slice(0, 500),
      content: r.content,
      query,
      city,
      country,
    }));
  },
};

interface TavilyResult {
  title: string;
  url: string;
  content?: string;
  published_date?: string;
  score?: number;
}
