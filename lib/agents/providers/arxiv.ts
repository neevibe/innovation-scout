import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// arXiv — keyless, REST API at export.arxiv.org. ~1 req / 3 seconds.
// Scrapes very recent (last 3 months) papers in the categories that
// upstream-feed retail/F&B/lounge/experience-center innovation:
//   cs.AI, cs.CL, cs.CV, cs.HC (human-computer interaction, includes UX/retail)
//   + cs.IR (information retrieval, includes recommendation engines)
//   + econ.GN (general economics — relevant for commercial studies)
// ---------------------------------------------------------------------------

const CATEGORIES = ["cs.AI", "cs.CL", "cs.CV", "cs.HC", "cs.IR", "econ.GN"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const arxivProvider: SearchProvider = {
  id: "arxiv",
  label: "arXiv research",
  keyless: true,
  complianceNote: "arXiv public REST API. Polite 1s spacing. Categories: cs.AI, cs.CL, cs.CV, cs.HC, cs.IR, econ.GN (3-month window).",

  async search(query, opts) {
    const out: RawDoc[] = [];
    for (const cat of CATEGORIES) {
      try {
        const q = `(${encodeURIComponent(query)}) AND cat:${cat}`;
        const url = `https://export.arxiv.org/api/query?search_query=${q}&max_results=5&sortBy=submittedDate&sortOrder=descending`;
        const res = await fetch(url, {
          headers: { Accept: "application/atom+xml" },
          cache: "no-store",
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const entries = parseArxiv(xml);
        for (const e of entries) {
          out.push({
            title: e.title,
            url: e.url,
            source: "arxiv.org",
            publishedAt: e.publishedAt,
            snippet: e.summary,
            content: e.summary,
            query: cat,
            city: opts.city,
            country: opts.country,
          });
        }
        await sleep(800); // arXiv asks for >= 3s between bursts; we don't burst
      } catch {
        // network/parse errors fall through
      }
    }
    if (out.length === 0) return [];
    for (const d of out) if (!d.source || d.source === "unknown") d.source = domainOf(d.url) || "arxiv.org";
    return out;
  },
};

interface ArxivEntry { title: string; url: string; summary: string; publishedAt: string }

// Minimal Atom XML parser — no deps. arXiv's feed is well-formed enough.
function parseArxiv(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml))) {
    const block = m[1];
    const title = stripTag(block, "title") ?? "";
    const id = stripTag(block, "id") ?? "";
    const summary = stripTag(block, "summary") ?? "";
    const published = stripTag(block, "published") ?? "";
    if (!id) continue;
    entries.push({
      title: cleanWs(title),
      url: id.trim(),
      summary: cleanWs(summary).slice(0, 500),
      publishedAt: published.slice(0, 19) + "Z",
    });
  }
  return entries;
}

function stripTag(s: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(s);
  return m ? m[1] : null;
}

function cleanWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
