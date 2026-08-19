import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// GDELT Doc 2.0 API — keyless and built for programmatic use (compliant).
// Good production-grade free option where reachable. Some sandboxed networks
// block its host; the collector falls back automatically if it errors.
// ---------------------------------------------------------------------------
export const gdeltProvider: SearchProvider = {
  id: "gdelt",
  label: "GDELT Doc 2.0",
  keyless: true,
  complianceNote: "Keyless, programmatic-use-friendly. Preferred keyless option for production.",

  async search(query, { city, country, timespanMonths }) {
    const url =
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}` +
      `&mode=ArtList&format=json&maxrecords=15&timespan=${timespanMonths}m&sort=DateDesc`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`gdelt ${res.status}`);
    const data = (await res.json()) as { articles?: GdeltArticle[] };
    return (data.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      source: a.domain || domainOf(a.url),
      publishedAt: parseGdeltDate(a.seendate),
      snippet: a.title,
      query,
      city,
      country,
    }));
  },
};

interface GdeltArticle {
  url: string;
  title: string;
  domain?: string;
  seendate?: string; // e.g. 20260815T120000Z
  language?: string;
}

function parseGdeltDate(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, se] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}Z`;
}
