import { newsSearch, ageDays, ageLabel, resolveGoogleNewsUrl, type NewsDoc, type NewsResult } from "./research";
import { resolveImage, wikipediaImage, type ResolvedImage } from "./images";
import { ALL_CANDIDATES } from "@/lib/data/candidates";
import trendsSnapshot from "@/lib/data/trendsSnapshot.json";

// ===========================================================================
// FRESHNESS AGENT
// Audits every time-sensitive surface of the console, then rebuilds the stale
// ones from live research:
//   • The Scout Daily        → composed fresh from today's news (+ public images)
//   • Globe signal evidence  → real articles with real ages per city
//   • BLR opportunities      → top scored candidates, re-ranked by fresh buzz
//   • Trend Intelligence     → snapshot age audited (refresh: `npm run freshness`)
// Runs on the daily Vercel cron (/api/freshness), on demand (POST), and from
// the CLI (`npm run freshness`, which also writes the committed fallback).
// ===========================================================================

export interface DailyItem {
  title: string;
  url: string;
  publisher: string;
  age: string;
  publishedAt?: string;
  category: string;
}

export interface ScoutDaily {
  date: string; // e.g. "5 OCTOBER 2026"
  generatedAt: string;
  provider: string;
  topStory: {
    kicker: string;
    headline: string;
    url: string;
    publisher: string;
    age: string;
    paragraphs: string[];
    related: DailyItem[];
    image: ResolvedImage | null;
  } | null;
  india: DailyItem[];
  global: DailyItem[];
  categoryWatch: { category: string; count: number }[];
  brandMoves: { kind: string; brand: string; place: string; category: string; headline: string; url: string; publisher: string; age: string; image: ResolvedImage | null }[];
  opportunities: { brand: string; city: string; category: string; score: number; freshMentions: number; image: ResolvedImage | null; latest?: DailyItem }[];
}

export interface GlobeFresh {
  generatedAt: string;
  cities: Record<string, { days: number; evid: [string, string, string, string, string, string][]; image: ResolvedImage | null }>;
}

export interface AuditItem {
  surface: string;
  status: "fresh" | "stale" | "fixed" | "failed";
  asOf: string | null;
  ageDays: number | null;
  detail: string;
}

export interface FreshnessReport {
  ranAt: string;
  durationMs: number;
  provider: string;
  audit: AuditItem[];
  daily: ScoutDaily;
  globe: GlobeFresh;
}

// --- Beats the Daily sweeps -------------------------------------------------
const INDIA_BEATS = [
  "Bengaluru Kempegowda airport new store launch",
  "Indian D2C brand opens flagship store",
  "India airport retail duty free new concept",
  "Indian brand expansion new outlets Mumbai Delhi",
];
const GLOBAL_BEATS = [
  "airport travel retail new store opening",
  "Dubai International airport new concept launch",
  "Changi airport new retail dining concept",
  "Incheon airport duty free beauty",
  "Heathrow airport new store opening",
  "Hamad airport Doha new retail",
  "airport dining new restaurant concept opens",
];

// City → query used to refresh the globe signal evidence.
export const GLOBE_QUERIES: Record<string, string> = {
  BLR: "Bengaluru airport retail café brand",
  DEL: "Delhi airport luxury beauty duty free",
  BOM: "Mumbai premium Indian D2C brand store",
  HYD: "Hyderabad fine jewellery store launch",
  MAA: "Chennai QSR restaurant chain expansion",
  CCU: "Kolkata craft retail brand store",
  PNQ: "Pune fashion brand store launch",
  AMD: "Ahmedabad jewellery brand showroom",
  COK: "Kochi wellness brand launch",
  GOI: "Goa airport travel retail",
  JAI: "Jaipur craft luxury brand",
  ICN: "Incheon airport Olive Young K-beauty",
  DXB: "Dubai airport new restaurant dining concept",
  SIN: "Changi airport retail concept",
  NRT: "Narita Haneda airport convenience food retail",
  LHR: "Heathrow airport wellness luxury store",
  CDG: "Paris CDG airport beauty duty free",
  BKK: "Suvarnabhumi airport food concept",
  HKG: "Hong Kong airport travel retail",
  DOH: "Hamad International airport luxury retail",
  JFK: "JFK airport new terminal retail brands",
  SYD: "Sydney airport wellness retail",
  IST: "Istanbul airport retail expansion",
  KUL: "KLIA airport halal premium brand",
  SFO: "San Francisco airport new concept store",
  AMS: "Schiphol airport retail format",
};

// A globe card only accepts a story that names its own city / airport.
const CITY_TERMS: Record<string, RegExp> = {
  BLR: /bengaluru|bangalore|kempegowda|\bblr\b/i, DEL: /delhi|\bigi\b/i, BOM: /mumbai|bombay/i, HYD: /hyderabad/i,
  MAA: /chennai/i, CCU: /kolkata/i, PNQ: /pune/i, AMD: /ahmedabad/i, COK: /kochi|cochin/i, GOI: /\bgoa\b|mopa|dabolim/i,
  JAI: /jaipur/i, ICN: /incheon|seoul|korea/i, DXB: /dubai|\bdxb\b/i, SIN: /singapore|changi/i, NRT: /tokyo|narita|haneda|japan/i,
  LHR: /london|heathrow/i, CDG: /paris|charles de gaulle|\bcdg\b/i, BKK: /bangkok|suvarnabhumi|thailand/i,
  HKG: /hong kong/i, DOH: /doha|hamad|qatar/i, JFK: /new york|\bjfk\b/i, SYD: /sydney/i, IST: /istanbul/i,
  KUL: /kuala lumpur|\bklia\b|malaysia/i, SFO: /san francisco|\bsfo\b/i, AMS: /amsterdam|schiphol/i,
};

const TRADE_PRESS = /moodie ?davitt|trbusiness|dfni|travel ?retail ?(?:business|magazin)|travel ?retail|duty ?free|dfnionline|ttgasia|retail ?gazette|businessoffashion|insideretail|wwd/i;

const CATEGORY_RULES: [string, RegExp][] = [
  ["BEAUTY", /\b(beauty|cosmetics?|skincare|fragrances?|perfumes?|k-beauty|olive young|sephora)\b/i],
  ["F&B", /\b(restaurants?|dining|caf[eé]s?|coffee|food|bars?|bakery|chef|teas?|chai|qsr)\b/i],
  ["JEWELLERY", /\b(jewell?e?ry|jewellers?|diamonds?|gold|watches)\b/i],
  ["FASHION", /\b(fashion|apparel|sneakers?|luggage|bags?|footwear|clothing)\b/i],
  ["DUTY-FREE", /\b(duty[- ]free|travel retail|tax[- ]free)\b/i],
  ["WELLNESS", /\b(wellness|spa|sleep|fitness|yoga)\b/i],
  ["LOUNGES", /\blounges?\b/i],
  ["TECHNOLOGY", /\b(digital|biometric|ai|robots?|apps?|online)\b/i],
  ["EXPERIENCE", /\b(experiences?|pop-ups?|museum|art|immersive|gallery)\b/i],
];

export function categorise(text: string): string {
  for (const [c, re] of CATEGORY_RULES) if (re.test(text)) return c;
  return "RETAIL";
}

const COMMERCE = /\b(stores?|retail|shops?|brands?|duty[- ]free|beauty|restaurants?|dining|caf[eé]s?|launch\w*|opens?|opening|concepts?|lounges?|boutiques?|flagship|outlets?|expan\w+|showroom|pop-up|travel retail|jewell?e?ry|wellness|food)\b/i;

const NOISE = /scam|fraud|\((?:NSE|BSE|NYSE|NASDAQ):|share price|stock|ipo|sensex|nifty|quarterly results|q[1-4] results|crash|killed|dies|arrested|strike|delay|bomb|weather/i;

// --- small concurrency helper ------------------------------------------------
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    })
  );
  return out;
}

async function safeSearch(q: string, days: number): Promise<NewsResult> {
  try {
    return await newsSearch(q, days);
  } catch {
    return { docs: [], images: [], provider: "googlenews" };
  }
}

const STOP = new Set("the a an and of to in at on for with its new opens open launch launches airport store from by as is first".split(" "));
const tokens = (t: string) => new Set(norm(t).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));
function similar(a: string, b: string): boolean {
  const A = tokens(a), B = tokens(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter >= 2 && inter / Math.min(A.size, B.size) >= 0.5;
}

/** Group near-duplicate headlines (same story, different publishers). */
function cluster(docs: NewsDoc[]): NewsDoc[][] {
  const groups: NewsDoc[][] = [];
  for (const d of docs) {
    const g = groups.find((g) => similar(g[0].title, d.title));
    if (g) g.push(d);
    else groups.push([d]);
  }
  return groups;
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function toItem(d: NewsDoc): DailyItem {
  return { title: d.title, url: d.url, publisher: d.publisher, age: ageLabel(d.publishedAt), publishedAt: d.publishedAt, category: categorise(`${d.title} ${d.snippet}`) };
}

function dedupe(docs: NewsDoc[]): NewsDoc[] {
  const seen = new Set<string>();
  return docs.filter((d) => {
    const k = norm(d.title).slice(0, 60);
    if (!k || seen.has(k) || NOISE.test(d.title)) return false;
    seen.add(k);
    return true;
  });
}

function relevance(d: NewsDoc): number {
  const t = `${d.title} ${d.snippet}`;
  let s = 0;
  if (/airport|terminal|airside|travel retail|duty[- ]free/i.test(t)) s += 3;
  if (/launch|opens?|opening|debut|unveil|introduc|expand|flagship|new concept|first/i.test(t)) s += 2;
  if (/india|bengaluru|bangalore|mumbai|delhi/i.test(t)) s += 1;
  if (TRADE_PRESS.test(d.publisher) || TRADE_PRESS.test(d.url)) s += 1;
  s += Math.max(0, 3 - ageDays(d.publishedAt) / 3); // recency, up to +3
  return s;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).toUpperCase();

/** Capitalised name runs in a headline: "TWG Tea opens … at Changi Airport" → ["TWG Tea", "Changi Airport"]. */
export function entities(title: string): string[] {
  const out: string[] = [];
  const re = /((?:[A-Z][\w&'’.-]*|[A-Z]{2,})(?:\s+(?:&\s+)?(?:[A-Z][\w&'’.-]*|of|de))*)/g;
  for (const m of title.matchAll(re)) {
    // Title-case headlines capitalise verbs too: cut the run at the first one.
    const e = m[1]
      .split(/\s+(?=(?:Opens?|Launch\w*|Unveils?|Debuts?|Expands?|Enters?|Introduc\w*|Adds?|Announces?|Arrives?|To|At|In|With|For|And)\b)/)[0]
      .replace(/\s+(of|de)$/, "")
      .trim();
    if (e.length > 2 && !/^(The|A|An|Up|New|First|Top|How|Why|What|Flying|In|At)$/.test(e)) out.push(e);
  }
  return [...new Set(out)];
}

async function firstWikiImage(names: string[]): Promise<ResolvedImage | null> {
  for (const n of names.slice(0, 3)) {
    const img = await wikipediaImage(n);
    if (img) return img;
  }
  return null;
}

// --- The Scout Daily ----------------------------------------------------------
export async function composeDaily(): Promise<ScoutDaily> {
  const indiaRes = await pool(INDIA_BEATS, 4, (q) => safeSearch(q, 7));
  const globalRes = await pool(GLOBAL_BEATS, 4, (q) => safeSearch(q, 7));
  const provider = [...indiaRes, ...globalRes].find((r) => r.docs.length)?.provider || "none";

  const score = (g: NewsDoc[]) => relevance(g[0]) + Math.min(4, (g.length - 1) * 1.5);
  const byScore = (a: NewsDoc[], b: NewsDoc[]) => score(b) - score(a);
  const indiaG = cluster(dedupe(indiaRes.flatMap((r) => r.docs)).sort((a, b) => relevance(b) - relevance(a))).sort(byScore);
  const globalG = cluster(dedupe(globalRes.flatMap((r) => r.docs)).sort((a, b) => relevance(b) - relevance(a))).sort(byScore);
  const allG = cluster(dedupe([...indiaG.flat(), ...globalG.flat()]).sort((a, b) => relevance(b) - relevance(a))).sort(byScore);
  const all = allG.flat();

  // Top story = the fresh airport/brand story with the strongest relevance and
  // the widest coverage; its other publishers become the related coverage.
  const leadGroup = allG[0];
  const lead = leadGroup?.[0];
  const leadEntity = lead ? entities(lead.title)[0] : undefined;
  const isLead = (g: NewsDoc[]) =>
    !!lead && g.some((d) => similar(d.title, lead.title) || (!!leadEntity && d.title.includes(leadEntity.split(" ")[0])));
  let topStory: ScoutDaily["topStory"] = null;
  if (lead) {
    const cat = categorise(`${lead.title} ${lead.snippet}`);
    const related = leadGroup.slice(1, 4);
    const sameCat = allG.filter((g) => g !== leadGroup && categorise(g[0].title) === cat).length;
    const leadRes = [...indiaRes, ...globalRes].find((r) => r.docs.some((d) => d.url === lead.url));
    await pool(leadGroup.slice(0, 4), 4, async (d) => { d.url = await resolveGoogleNewsUrl(d.url); });
    const image =
      (await resolveImage({
        brand: entities(lead.title)[0] || lead.title,
        articleUrls: leadGroup.map((d) => ({ url: d.url, publisher: d.publisher })),
        tavilyImages: leadRes?.images,
      })) || (await firstWikiImage(entities(lead.title).slice(1)));
    const indiaAngle = /india|bengaluru|bangalore|mumbai|delhi|chennai|hyderabad/i.test(`${lead.title} ${lead.snippet}`);
    const pubs = [...new Set(leadGroup.map((d) => d.publisher))];
    topStory = {
      kicker: `TOP STORY · ${cat}`,
      headline: lead.title,
      url: lead.url,
      publisher: lead.publisher,
      age: ageLabel(lead.publishedAt),
      paragraphs: [
        lead.snippet && norm(lead.snippet) !== norm(lead.title) && lead.snippet.length > 80
          ? lead.snippet
          : `${lead.publisher} reported it ${ageLabel(lead.publishedAt).toLowerCase()}: ${lead.title}.`,
        pubs.length > 1
          ? `The story is being carried by ${pubs.length} publishers (${pubs.slice(0, 4).join(", ")}), and ${sameCat} further ${cat.toLowerCase()} moves surfaced in the same sweep of ${all.length} fresh stories.`
          : `It was the strongest ${cat.toLowerCase()} signal in today's sweep of ${all.length} fresh stories, with ${sameCat} further moves in the same category.`,
        indiaAngle
          ? `For BLR this is a home-market signal: the scout tracks whether it reaches Bengaluru's catchment before an airport format exists.`
          : `For BLR the question is format fit: whether this ${cat.toLowerCase()} move can work in a 40–60 sqm airside footprint for Bengaluru's outbound mix.`,
      ],
      related: related.map(toItem),
      image,
    };
  }

  const counts = new Map<string, number>();
  for (const g of allG) {
    const c = categorise(`${g[0].title} ${g[0].snippet}`);
    counts.set(c, (counts.get(c) || 0) + 1);
  }

  const india = indiaG.filter((g) => !isLead(g)).slice(0, 3).map((g) => g[0]);
  const global = globalG.filter((g) => !isLead(g) && !/india|indian/i.test(g[0].title)).slice(0, 7).map((g) => g[0]);
  await pool([...india, ...global], 5, async (d) => { d.url = await resolveGoogleNewsUrl(d.url); });

  // Brand movement evidence layer: the three strongest brand-led moves.
  const MOVE = /\b(opens?|opening|launch\w*|debuts?|unveils?|expands?|enters?|introduc\w*|arrives?)\b/i;
  const seenBrand = new Set<string>();
  const moveGroups = allG
    .filter((g) => {
      const e = entities(g[0].title)[0];
      const key = e?.toLowerCase().split(" ")[0];
      if (!MOVE.test(g[0].title) || !key || seenBrand.has(key)) return false;
      seenBrand.add(key);
      return true;
    })
    .slice(0, 3);
  const brandMoves = await pool(moveGroups, 3, async (g) => {
    const d = g[0];
    if (!g.includes(lead!)) await pool(g.slice(0, 3), 3, async (x) => { x.url = await resolveGoogleNewsUrl(x.url); });
    const brand = entities(d.title)[0];
    const place = Object.entries(CITY_TERMS).find(([, re]) => re.test(d.title))?.[0] || "GLOBAL";
    const kind = /airport|terminal|airside|duty[- ]free/i.test(d.title) ? "AIRPORT ENTRY" : /expand|enters|arrives/i.test(d.title) ? "MARKET EXPANSION" : "NEW STORE DETECTED";
    const leadRes = [...indiaRes, ...globalRes].find((r) => r.docs.some((x) => x.url === d.url));
    return {
      kind,
      brand,
      place,
      category: categorise(d.title),
      headline: d.title,
      url: d.url,
      publisher: d.publisher,
      age: ageLabel(d.publishedAt),
      image: await resolveImage({ brand, articleUrls: g.map((x) => ({ url: x.url, publisher: x.publisher })), tavilyImages: leadRes?.images }),
    };
  });

  return {
    date: fmtDate(new Date()),
    generatedAt: new Date().toISOString(),
    provider,
    topStory,
    india: india.map(toItem),
    global: global.map(toItem),
    brandMoves,
    categoryWatch: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([category, count]) => ({ category, count })),
    opportunities: await freshOpportunities(),
  };
}

// --- BLR opportunities: top candidates re-ranked by fresh buzz ----------------
async function freshOpportunities(): Promise<ScoutDaily["opportunities"]> {
  const top = [...ALL_CANDIDATES].sort((a, b) => b.score - a.score).slice(0, 8);
  const checked = await pool(top, 4, async (c) => {
    const brand = c.brand.replace(/\(.*?\)/g, "").trim();
    const r = await safeSearch(`"${brand}"`, 30);
    const mentions = dedupe(r.docs).filter((d) => norm(`${d.title} ${d.snippet}`).includes(norm(brand).split(" ")[0]));
    await pool(mentions.slice(0, 2), 2, async (d) => { d.url = await resolveGoogleNewsUrl(d.url); });
    return { c, brand, mentions, images: r.images };
  });
  // Fresh coverage adds up to +6 to the model score for ranking only.
  const ranked = checked
    .map((x) => ({ ...x, rank: x.c.score + Math.min(6, x.mentions.length * 1.5) }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);
  return pool(ranked, 3, async (x) => ({
    brand: x.brand,
    city: x.c.city,
    category: x.c.category,
    score: x.c.score,
    freshMentions: x.mentions.length,
    latest: x.mentions[0] ? toItem(x.mentions[0]) : undefined,
    image:
      (await wikipediaImage(x.brand, { allowLogo: true })) ||
      (await resolveImage({
        brand: x.brand,
        articleUrls: [...x.mentions.slice(0, 2), ...x.c.sources.map((s) => ({ url: s.url, publisher: s.label.split(" — ")[0] }))].map((d) => ({
          url: d.url,
          publisher: "publisher" in d ? d.publisher : "",
        })),
        tavilyImages: x.images,
      })),
  }));
}

// --- Globe signal evidence ------------------------------------------------------
export async function freshenGlobe(): Promise<GlobeFresh> {
  const codes = Object.keys(GLOBE_QUERIES);
  const results = await pool(codes, 6, async (code) => {
    const r = await safeSearch(GLOBE_QUERIES[code], 30);
    const docs = cluster(dedupe(r.docs).filter((d) => COMMERCE.test(d.title) && (CITY_TERMS[code]?.test(d.title) ?? true) && !/trip report|things to do|itinerary|guide to|best .* to visit/i.test(d.title)))
      .map((g) => g[0])
      .sort((a, b) => ageDays(a.publishedAt) - ageDays(b.publishedAt))
      .slice(0, 3);
    await pool(docs, 3, async (d) => { d.url = await resolveGoogleNewsUrl(d.url); });
    return { code, docs };
  });
  const cities: GlobeFresh["cities"] = {};
  for (const { code, docs } of results) {
    if (!docs.length) continue;
    cities[code] = {
      days: Math.max(1, ageDays(docs[0].publishedAt)),
      image: null,
      evid: docs.map((d) => [
        d.publisher.toUpperCase().slice(0, 28),
        ageLabel(d.publishedAt),
        TRADE_PRESS.test(d.publisher) || TRADE_PRESS.test(d.url) ? "TRADE PRESS" : "NEWS",
        TRADE_PRESS.test(d.publisher) || TRADE_PRESS.test(d.url) ? "0.90" : "0.82",
        d.title,
        d.url,
      ]),
    };
  }
  return { generatedAt: new Date().toISOString(), cities };
}

// --- Audit ----------------------------------------------------------------------
export function audit(current: { daily?: ScoutDaily | null; globe?: GlobeFresh | null }, maxAgeDays = 1): AuditItem[] {
  const now = Date.now();
  const age = (iso?: string | null) => (iso ? Math.floor((now - new Date(iso).getTime()) / 86400000) : null);
  const item = (surface: string, asOf: string | null | undefined, limit: number, detail: string): AuditItem => {
    const a = age(asOf);
    return { surface, asOf: asOf || null, ageDays: a, status: a !== null && a <= limit ? "fresh" : "stale", detail };
  };
  const trendsAt = (trendsSnapshot as { generatedAt?: string }).generatedAt;
  return [
    item("The Scout Daily", current.daily?.generatedAt, maxAgeDays, current.daily ? `Edition dated ${current.daily.date}` : "Hard-coded edition (26 Aug 2026)"),
    item("Globe signal evidence", current.globe?.generatedAt, maxAgeDays, current.globe ? `${Object.keys(current.globe.cities).length} cities with live evidence` : "Hard-coded evidence with fixed 'N DAYS AGO' labels"),
    item("BLR opportunities (Daily)", current.daily?.generatedAt, maxAgeDays, current.daily ? `${current.daily.opportunities.length} re-ranked by fresh buzz` : "Hard-coded scores"),
    item("Trend Intelligence snapshot", trendsAt, 3, "Rebuilt by `npm run freshness` (needs yt-dlp; runs locally, then redeploy)"),
  ];
}

// --- Run ------------------------------------------------------------------------
export async function runFreshnessAgent(previous?: { daily?: ScoutDaily | null; globe?: GlobeFresh | null }): Promise<FreshnessReport> {
  const t0 = Date.now();
  const before = audit(previous || {});
  const [daily, globe] = await Promise.all([composeDaily(), freshenGlobe()]);
  const after = audit({ daily, globe });
  const merged = after.map((a, i) => {
    const ok = a.surface === "The Scout Daily" ? !!daily.topStory : a.surface === "Globe signal evidence" ? Object.keys(globe.cities).length > 0 : true;
    if (!ok) return { ...a, status: "failed" as const, detail: `${a.detail} — live research returned nothing` };
    return before[i].status === "stale" && a.status === "fresh" ? { ...a, status: "fixed" as const } : a;
  });
  return { ranAt: new Date().toISOString(), durationMs: Date.now() - t0, provider: daily.provider, audit: merged, daily, globe };
}
