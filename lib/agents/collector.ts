import type { Signal } from "@/lib/types";
import { Repo } from "@/lib/db/store";
import { selectProvider, fallbackChain, type RawDoc, type SearchProvider } from "./providers";
import { extractSignals } from "./extract";

// ===========================================================================
// Collection layer (Agent 1: Scout + data acquisition)
// ---------------------------------------------------------------------------
// OFFLINE (default): returns already-collected signals from the store.
// LIVE (SCOUT_MODE=live): real search across pilot cities × lenses via the
//   selected provider (Tavily / GDELT / Google News), deduped by URL, then
//   structured by the extractor (LLM if AI_GATEWAY_API_KEY set, else heuristic).
// Everything upstream (pipeline, scoring, UI) is unchanged either way.
// ===========================================================================

const isLive = () => process.env.SCOUT_MODE === "live";

const LENSES = [
  "new retail brand OR store opening OR expansion",
  "new restaurant OR cafe OR F&B concept",
  "airport duty free OR travel retail brand OR new product launch",
  "new service OR experiential concept OR pop-up OR activation",
  "travel service OR wellness OR spa OR sleep pod OR forex OR eSIM OR lounge",
  "retail technology OR phygital OR loyalty OR click-and-collect OR digital commerce",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CollectionResult {
  signals: Signal[];
  meta: {
    live: boolean;
    provider?: string;
    usedLLM?: boolean;
    queriesRun?: number;
    docsFound?: number;
    complianceNote?: string;
  };
}

export async function collectSignalsDetailed(): Promise<CollectionResult> {
  if (!isLive()) {
    return { signals: await Repo.signals(), meta: { live: false } };
  }
  try {
    return await collectLive();
  } catch (err) {
    console.error("[collector] live collection failed, using stored signals:", err);
    return { signals: await Repo.signals(), meta: { live: true, provider: "error-fallback" } };
  }
}

// Back-compat: the orchestrator calls this.
export async function collectSignals(): Promise<Signal[]> {
  return (await collectSignalsDetailed()).signals;
}

async function collectLive(): Promise<CollectionResult> {
  const cfg = await Repo.config();
  const cities = (await Repo.cities()).filter((c) => c.active);
  const provider = selectProvider();
  const chain = fallbackChain();
  const months = Math.max(1, Math.min(3, Math.round(cfg.monitoringFrequencyHours >= 0 ? 3 : 3)));

  // Fan out queries: city × lens. Cap breadth to keep a refresh responsive.
  const tasks: { query: string; city: string; country: string }[] = [];
  for (const c of cities) {
    for (const lens of LENSES) {
      tasks.push({ query: `${c.name} ${lens}`, city: c.name, country: c.country });
    }
  }

  const seen = new Set<string>();
  const docs: RawDoc[] = [];
  let queriesRun = 0;

  // Run with limited concurrency + inter-batch spacing to stay under provider
  // rate limits (keyless news endpoints throttle bursts).
  const CONC = 3;
  for (let i = 0; i < tasks.length; i += CONC) {
    const batch = tasks.slice(i, i + CONC);
    const results = await Promise.all(
      batch.map((t) => searchWithFallback(chain, t.query, { city: t.city, country: t.country, timespanMonths: months }))
    );
    queriesRun += batch.length;
    if (i + CONC < tasks.length) await sleep(350);
    for (const list of results) {
      for (const d of list) {
        const key = d.url.split("?")[0];
        if (seen.has(key)) continue;
        seen.add(key);
        docs.push(d);
      }
    }
  }

  // Structure the raw docs into Signals (LLM or heuristic). Batch for the LLM.
  const { signals, usedLLM } = await extractInBatches(docs);

  return {
    signals,
    meta: {
      live: true,
      provider: provider.id,
      usedLLM,
      queriesRun,
      docsFound: docs.length,
      complianceNote: provider.complianceNote,
    },
  };
}

async function searchWithFallback(
  chain: SearchProvider[],
  query: string,
  opts: { city: string; country: string; timespanMonths: number }
): Promise<RawDoc[]> {
  for (const provider of chain) {
    // one retry per provider to ride out transient throttling
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const docs = await provider.search(query, opts);
        if (docs.length > 0 || attempt === 1) return docs;
      } catch {
        // fall through to retry / next provider
      }
      await sleep(300);
    }
  }
  return [];
}

async function extractInBatches(docs: RawDoc[]): Promise<{ signals: Signal[]; usedLLM: boolean }> {
  const BATCH = 10;
  const all: Signal[] = [];
  let usedLLM = false;
  for (let i = 0; i < docs.length; i += BATCH) {
    const { signals, usedLLM: u } = await extractSignals(docs.slice(i, i + BATCH));
    usedLLM = usedLLM || u;
    all.push(...signals);
  }
  return { signals: all, usedLLM };
}
