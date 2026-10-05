// ---------------------------------------------------------------------------
// Freshness Agent — public brand imagery.
// Resolves a publicly available image for a brand/story, in order:
//   1. the source article's own og:image (the publisher's press image),
//   2. images Tavily associated with the search,
//   3. Wikipedia / Wikimedia Commons page image for the brand (freely licensed).
// Every candidate is verified (reachable, image/* content type) before use and
// returned with a credit line so the page can attribute it.
// ---------------------------------------------------------------------------

export interface ResolvedImage {
  url: string;
  credit: string; // publisher / "Wikimedia Commons"
  sourceUrl: string; // page the image came from
  via: "og:image" | "tavily" | "wikipedia";
}

const UA = "Mozilla/5.0 (compatible; BIAL-Scout-Freshness/1.0; +https://innovation-scout.vercel.app)";

export async function resolveImage(opts: {
  brand: string;
  articleUrls?: { url: string; publisher: string }[];
  tavilyImages?: string[];
  allowLogo?: boolean;
}): Promise<ResolvedImage | null> {
  for (const a of (opts.articleUrls || []).slice(0, 4)) {
    // Google News links are opaque redirects; their pages carry Google's own image.
    if (/news\.google\.com/.test(a.url)) continue;
    const og = await ogImage(a.url);
    if (og && (await isImage(og))) return { url: og, credit: a.publisher, sourceUrl: a.url, via: "og:image" };
  }
  for (const img of (opts.tavilyImages || []).slice(0, 4)) {
    if (await isImage(img)) return { url: img, credit: hostOf(img), sourceUrl: img, via: "tavily" };
  }
  return wikipediaImage(opts.brand, { allowLogo: opts.allowLogo });
}

export async function wikipediaImage(brand: string, opts: { allowLogo?: boolean } = {}): Promise<ResolvedImage | null> {
  const q = brand.replace(/\(.*?\)/g, "").replace(/\band peers\b|\boperators?\b|\bprogramme\b/gi, "").trim();
  if (q.length < 3) return null;
  const api =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=3" +
    `&gsrsearch=${encodeURIComponent(q)}&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=1280`;
  try {
    const res = await fetch(api, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { title: string; index: number; fullurl: string; thumbnail?: { source: string } }> };
    };
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
    // Only accept a page whose title names the brand (every significant word),
    // so a generic article never stands in for the brand.
    const flat = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const words = flat(q).split(" ").filter((w) => w.length > 2 && !["the", "and", "cafe"].includes(w));
    const hit = pages.find((p) => p.thumbnail && words.length > 0 && words.every((w) => flat(p.title).replace(/ /g, "").includes(w)));
    if (!hit?.thumbnail) return null;
    // Logos make poor hero images; callers that want a photo skip them.
    if (!opts.allowLogo && /logo|wordmark|\.svg/i.test(decodeURIComponent(hit.thumbnail.source))) return null;
    return { url: hit.thumbnail.source, credit: "Wikimedia Commons", sourceUrl: hit.fullurl, via: "wikipedia" };
  } catch {
    return null;
  }
}

async function ogImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const tag =
      html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i)?.[0] || "";
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (!content) return null;
    const abs = new URL(content.replace(/&amp;/g, "&"), res.url).toString();
    return abs.startsWith("https://") ? abs : null;
  } catch {
    return null;
  }
}

async function isImage(url: string): Promise<boolean> {
  if (!/^https:\/\//.test(url)) return false;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    const ok = res.ok && (res.headers.get("content-type") || "").startsWith("image/");
    res.body?.cancel().catch(() => {});
    return ok;
  } catch {
    return false;
  }
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "public web";
  }
}
