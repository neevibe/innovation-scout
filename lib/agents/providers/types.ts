// Common shape every search/news provider normalises into.
export interface RawDoc {
  title: string;
  url: string;
  source: string; // publisher / domain
  publishedAt?: string; // ISO
  snippet: string;
  content?: string; // fuller text when the provider returns it
  query: string; // the query that surfaced this doc
  city: string; // the pilot city the query was scoped to
  country: string;
}

export interface SearchProvider {
  readonly id: string;
  readonly label: string;
  readonly keyless: boolean;
  readonly complianceNote: string;
  /** Optional cap on how many of the 6 search lenses this provider runs per
   *  city per refresh. Omit for the full fan-out. Use this for providers
   *  with heavy per-query cost (e.g. local-LLM-backed agents) so a single
   *  refresh stays bounded — e.g. 1 restricts to the single most relevant
   *  lens (duty free / travel retail) instead of all 6. */
  readonly maxLenses?: number;
  /** false = an empty result is a real answer; don't fall back to news search. */
  readonly fallback?: boolean;
  search(query: string, opts: { city: string; country: string; timespanMonths: number }): Promise<RawDoc[]>;
}

// Small helper: strip HTML tags + collapse whitespace from RSS/HTML snippets.
export function stripHtml(s: string): string {
  // RSS descriptions are often entity-encoded HTML (&lt;a href…&gt;): decode
  // the angle brackets first so the tag pass below removes them too.
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;nbsp;/g, " ");
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
