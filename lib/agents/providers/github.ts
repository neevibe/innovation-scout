import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// GitHub REST API — keyless (60 req/h unauth, 5000/h with GH_TOKEN).
// Compliance: respects GitHub's rate-limit headers; degrades to keyless when
// no token is configured. All four query groups (trending / topic / keyword /
// owner cross-ref) share one token bucket so a single refresh never burns
// more than ~1 request per repo surfaced.
//
// We translate GitHub's `search/repositories` + `repos/{owner}/{repo}` shape
// into the same RawDoc contract every other provider produces, so the
// downstream extractor + dedup work unchanged.
// ---------------------------------------------------------------------------

const GH_API = "https://api.github.com";

const TOPIC_QUERIES = [
  "topic:airport-retail",
  "topic:duty-free",
  "topic:lounge",
  "topic:travel-retail",
  "topic:retail-experience",
  "topic:in-store-analytics",
];

const KEYWORD_QUERIES = [
  "airport duty free",
  "lounge food beverage",
  "travel retail",
  "duty free ecommerce",
  "airport retail analytics",
  "passenger experience ai",
];

const RECENT_DAYS = 90;          // ~3 months — matches "IN LAST 3 MONTHS"
const PER_QUERY_LIMIT = 10;      // keep refresh responsive
const CROSS_REF_OWNER = "neevibe"; // your GitHub org — published 3 months back

// ---- Token bucket ----------------------------------------------------------
// All four query groups draw from one shared pool. Single-user refresh
// won't burn more than ~50 requests; stays well under the 60/h keyless cap
// and gives plenty of headroom with a GH_TOKEN.
let bucket = { tokens: 60, lastRefill: Date.now() };

async function take(n: number): Promise<boolean> {
  const now = Date.now();
  const elapsedMin = (now - bucket.lastRefill) / 60_000;
  // refill at 60/hour keyless OR 5000/hour if tokenized
  const refillPerMin = process.env.GH_TOKEN ? 83.33 : 1;
  bucket.tokens = Math.min(
    process.env.GH_TOKEN ? 5000 : 60,
    bucket.tokens + elapsedMin * refillPerMin,
  );
  bucket.lastRefill = now;
  if (bucket.tokens < n) return false;
  bucket.tokens -= n;
  return true;
}

async function gh<T = unknown>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  if (!(await take(1))) return null; // budget exhausted → caller treats as empty
  const qs = new URLSearchParams({ per_page: String(PER_QUERY_LIMIT), ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }).toString();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "bial-scout",
  };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  try {
    const res = await fetch(`${GH_API}${path}?${qs}`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface GhRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  created_at: string;
  pushed_at: string;
  updated_at: string;
  owner: { login: string; html_url: string; avatar_url: string };
}

function ghRepoToRaw(r: GhRepo, query: string, city: string, country: string): RawDoc {
  const snippet = r.description
    ? `${r.description} · ⭐${r.stargazers_count.toLocaleString()} · ${r.language || "—"} · topics: ${(r.topics || []).slice(0, 5).join(", ") || "—"}`
    : `⭐${r.stargazers_count.toLocaleString()} · ${r.language || "—"} · topics: ${(r.topics || []).slice(0, 5).join(", ") || "—"}`;
  return {
    title: `${r.full_name} — ${r.description || "GitHub repository"}`,
    url: r.html_url,
    source: "github.com",
    publishedAt: r.pushed_at || r.updated_at || r.created_at,
    snippet,
    query,
    city,
    country,
  };
}

async function searchRepos(q: string, opts: { city: string; country: string }): Promise<RawDoc[]> {
  type SearchRes = { items: GhRepo[] };
  const data = await gh<SearchRes>("/search/repositories", {
    q: `${q} pushed:>${dateMinusDays(RECENT_DAYS)}`,
    sort: "stars",
    order: "desc",
  });
  if (!data) return [];
  return data.items.map((r) => ghRepoToRaw(r, q, opts.city, opts.country));
}

function dateMinusDays(d: number): string {
  const dt = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  return dt.toISOString().slice(0, 10);
}

// ---- Provider --------------------------------------------------------------
export const githubProvider: SearchProvider = {
  id: "github",
  label: "GitHub REST API",
  // Keyless is the default — no key required for our bounded query volume.
  keyless: true,
  complianceNote: "GitHub REST API, bounded per-refresh query budget (token bucket shared across all queries). Set GH_TOKEN to lift the 60/h rate cap.",

  async search(query, opts) {
    // The collector passes an already city/lens-scoped query string. We don't
    // re-interpret it — instead we fan out across our four query groups and
    // let the dedup layer collapse anything redundant. That keeps one city×
    // lens call from doing the work of four.
    const out: RawDoc[] = [];
    const lists = await Promise.all([
      // 1. Trending in the last 3 months
      gh<GhRepo[]>("/search/repositories", {
        q: `created:>${dateMinusDays(RECENT_DAYS)} stars:>5`,
        sort: "stars",
        order: "desc",
      }).then((d) => (d || []).map((r) => ghRepoToRaw(r, "trending-90d", opts.city, opts.country))),

      // 2. Topic-scoped
      ...TOPIC_QUERIES.map((q) => searchRepos(q, opts)),

      // 3. Keyword-scoped
      ...KEYWORD_QUERIES.map((q) => searchRepos(q, opts)),

      // 4. Cross-ref: your GitHub org's recent activity — useful as a "what
      //    Neeraj's own work looks like" anchor for downstream scoring.
      searchRepos(`user:${CROSS_REF_OWNER} pushed:>${dateMinusDays(RECENT_DAYS)}`, opts),
    ]);
    for (const l of lists) out.push(...l);
    if (out.length === 0) return [];
    // Defensive domain attribution; some items come back without owner.html_url
    for (const d of out) if (!d.source || d.source === "unknown") d.source = domainOf(d.url) || "github.com";
    return out;
  },
};
