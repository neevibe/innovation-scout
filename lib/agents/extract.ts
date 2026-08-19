import type { Signal, Vertical, SignalType, SourceTier } from "@/lib/types";
import type { RawDoc } from "./providers";
import { domainOf } from "./providers";

// ===========================================================================
// Signal extraction (Agent 2/3: Research + Trend)
// Two implementations, one output type:
//   - extractHeuristic(): deterministic, keyless. Lower confidence, flagged.
//   - extractWithLLM():   AI SDK v6 via Vercel AI Gateway. Grounded, structured.
// Anti-hallucination: every Signal carries the real source URL. The LLM is
// instructed to use ONLY the provided text and to drop docs it can't ground.
// ===========================================================================

function hashId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return "sig-" + (h >>> 0).toString(36);
}

function dedupeKey(title: string, city: string): string {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, 5)
    .sort()
    .join("-");
  return `${tokens}|${city.toLowerCase()}`;
}
const STOP = new Set(["with", "from", "this", "that", "airport", "brand", "will", "have", "into", "your", "more", "than", "over"]);

function tierFor(url: string, source: string): SourceTier {
  const d = (domainOf(url) + " " + source).toLowerCase();
  if (/(bengaluruairport|\.gov|official|changiairport|dubaiairports|heathrow)/.test(d)) return 1;
  if (/(reuters|bloomberg|ft\.com|economictimes|business-standard|livemint|forbes|cnbc|moodiedavitt|thehindu|hindustantimes|inc42)/.test(d)) return 2;
  if (/(instagram|twitter|x\.com|reddit|linkedin|youtube|tiktok)/.test(d)) return 4;
  return 3;
}

const FNB = /(coffee|cafe|café|restaurant|dining|food|bakery|patisserie|beverage|matcha|qsr|kitchen|brew|snack|tea|juice|dessert|chocolat)/i;
const DUTYFREE = /(duty[- ]free|fragrance|perfume|whisky|whiskey|liquor|spirits|confection|cosmetic|beauty|skincare)/i;
const RETAIL = /(retail|luggage|fashion|apparel|electronics|lifestyle|sneaker|watch|jewel|accessor|store|boutique|pop-?up)/i;

function classify(text: string): Vertical {
  if (DUTYFREE.test(text)) return "Duty Free";
  if (FNB.test(text)) return "F&B";
  if (RETAIL.test(text)) return "Retail";
  return "Retail";
}

function signalType(text: string): SignalType {
  const t = text.toLowerCase();
  if (/(airport|terminal|duty[- ]free|changi|heathrow|t2|t3)/.test(t) && /(open|launch|debut|unveil|pop-?up)/.test(t)) return "Airport Innovation";
  if (/(raise|funding|series [a-d]|valuation|expansion|expand|opens|rollout|stores)/.test(t)) return "Emerging Brand";
  if (/(partnership|partners with|tie-?up|joint venture|collaborat)/.test(t)) return "Partnership Opportunity";
  if (/(trend|surge|boom|growing|demand|rise of|gen z|viral)/.test(t)) return "Category Growth";
  if (/(new concept|first-of|format|reinvent|reimagin)/.test(t)) return "Emerging Concept";
  return "Category Growth";
}

const now = () => new Date().toISOString();

export function extractHeuristic(docs: RawDoc[]): Signal[] {
  return docs.map((d) => {
    const text = `${d.title}. ${d.snippet}`;
    const vertical = classify(text);
    return {
      id: hashId(d.url),
      timestamp: now(),
      firstDetectedAt: now(),
      lastUpdatedAt: now(),
      publishedAt: d.publishedAt,
      source: d.source,
      url: d.url,
      city: d.city,
      country: d.country,
      brand: undefined, // heuristic mode can't reliably name a brand
      company: undefined,
      category: vertical,
      subCategory: vertical === "F&B" ? "F&B trend" : vertical === "Duty Free" ? "Travel retail" : "Retail trend",
      signalType: signalType(text),
      trend: d.title.slice(0, 120),
      description: d.snippet || d.title,
      confidence: Math.max(41, Math.min(64, 48 + (3 - tierFor(d.url, d.source)) * 7)),
      sourceTier: tierFor(d.url, d.source),
      corroboratingUrls: [],
      dedupeKey: dedupeKey(d.title, d.city),
    } satisfies Signal;
  });
}

// --- LLM extraction (guarded; runs only when AI_GATEWAY_API_KEY is set) -----
export async function extractWithLLM(docs: RawDoc[]): Promise<Signal[]> {
  const { generateObject } = await import("ai");
  const { z } = await import("zod");

  const schema = z.object({
    signals: z.array(
      z.object({
        relevant: z.boolean().describe("true only if this is a genuine retail/F&B/duty-free commercial trend or brand movement relevant to an airport"),
        brand: z.string().nullable(),
        company: z.string().nullable(),
        vertical: z.enum(["Retail", "F&B", "Duty Free"]),
        subCategory: z.string(),
        signalType: z.enum([
          "Emerging Brand", "Emerging Concept", "Category Growth", "Airport Innovation",
          "Commercial Gap", "Competitive Movement", "Partnership Opportunity",
        ]),
        trend: z.string().describe("short trend label, <120 chars"),
        description: z.string().describe("one grounded sentence; use ONLY the provided text"),
        confidence: z.number().min(0).max(100),
        sourceIndex: z.number().describe("index of the source doc this came from"),
      })
    ),
  });

  const model = process.env.SCOUT_LLM_MODEL || "anthropic/claude-sonnet-5";
  const corpus = docs
    .map((d, i) => `[${i}] (${d.city}) ${d.title}\n${d.snippet}\nURL: ${d.url}`)
    .join("\n\n");

  const { object } = await generateObject({
    model,
    schema,
    prompt:
      "You are the Research + Trend agent for an airport commercial-intelligence system. " +
      "From the news items below, extract only genuine retail / F&B / duty-free commercial trends or brand movements. " +
      "Ground every field ONLY in the provided text — never invent brands, numbers, or facts. Drop anything not clearly relevant (set relevant=false).\n\n" +
      corpus,
  });

  return object.signals
    .filter((s) => s.relevant)
    .map((s) => {
      const d = docs[s.sourceIndex] ?? docs[0];
      return {
        id: hashId(d.url),
        timestamp: now(),
        firstDetectedAt: now(),
        lastUpdatedAt: now(),
        publishedAt: d.publishedAt,
        source: d.source,
        url: d.url,
        city: d.city,
        country: d.country,
        brand: s.brand || undefined,
        company: s.company || undefined,
        category: s.vertical,
        subCategory: s.subCategory,
        signalType: s.signalType,
        trend: s.trend,
        description: s.description,
        confidence: s.confidence,
        sourceTier: tierFor(d.url, d.source),
        corroboratingUrls: [],
        dedupeKey: dedupeKey(s.brand ? `${s.brand} ${s.trend}` : d.title, d.city),
      } satisfies Signal;
    });
}

export async function extractSignals(docs: RawDoc[]): Promise<{ signals: Signal[]; usedLLM: boolean }> {
  if (process.env.AI_GATEWAY_API_KEY) {
    try {
      return { signals: await extractWithLLM(docs), usedLLM: true };
    } catch (err) {
      console.error("[extract] LLM extraction failed, using heuristic:", err);
    }
  }
  return { signals: extractHeuristic(docs), usedLLM: false };
}
