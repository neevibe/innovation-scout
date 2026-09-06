import type { Signal } from "@/lib/types";
import { Repo } from "@/lib/db/store";
import {
  selectProvider,
  fallbackChain,
  type RawDoc,
  type SearchProvider,
} from "./providers";
import { tavilyProvider } from "./providers/tavily";
import { gdeltProvider } from "./providers/gdelt";
import { googleNewsProvider } from "./providers/googlenews";
import { githubProvider } from "./providers/github";
import { redditProvider } from "./providers/reddit";
import { youtubeProvider } from "./providers/youtube";
import { arxivProvider } from "./providers/arxiv";
import { extractSignals } from "./extract";

// ===========================================================================
// Collection layer (Agent 1: Scout + data acquisition)
// ---------------------------------------------------------------------------
// OFFLINE (default): returns already-collected signals from the store.
// LIVE (SCOUT_MODE=live): real fan-out across pilot cities × lenses × PROVIDERS.
//   Every active provider runs as an independent "sub-agent" — its own query
//   strategy, its own rate-limit discipline, its own RawDoc stream. Streams
//   are kept separately (`docsByProvider`) so the Mastery layer can attribute
//   each signal back to which sources surfaced it.
//
// Source roster is configurable from /admin — defaults to all four. Each
// refresh deepens the Master DB; nothing is wiped unless the admin explicitly
// resets it (see `npm run seed`).
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

/** Provider roster for the per-source sub-agent fan-out. Order matters only
 *  for display; the collector treats them as peers. */
export const ALL_PROVIDERS: Record<string, SearchProvider> = {
  tavily: tavilyProvider,
  gdelt: gdeltProvider,
  googlenews: googleNewsProvider,
  github: githubProvider,
  reddit: redditProvider,
  youtube: youtubeProvider,
  arxiv: arxivProvider,
};

export interface CollectionResult {
  signals: Signal[];
  /** Raw docs grouped by the provider that produced them. Used by Mastery
   *  layer to attribute signals to sources (provider-of-record). */
  docsByProvider: Record<string, RawDoc[]>;
  meta: {
    live: boolean;
    providersUsed: string[];
    usedLLM: boolean;
    queriesRun: number;
    docsFound: number;
    complianceNotes: Record<string, string>;
    failedProviders: string[];
  };
}

export async function collectSignalsDetailed(): Promise<CollectionResult> {
  if (!isLive()) {
    // Offline — derive docsByProvider from existing signal sources as a
    // best-effort so Mastery still has something to render.
    const sigs = await Repo.signals();
    const docsByProvider: Record<string, RawDoc[]> = { seed: [] };
    for (const s of sigs) {
      docsByProvider.seed.push({
        title: s.trend || s.brand || s.description.slice(0, 80),
        url: s.url,
        source: s.source,
        publishedAt: s.publishedAt,
        snippet: s.description.slice(0, 240),
        query: s.signalType,
        city: s.city,
        country: s.country,
      });
    }
    return { signals: sigs, docsByProvider, meta: { live: false, providersUsed: [], usedLLM: false, queriesRun: 0, docsFound: sigs.length, complianceNotes: {}, failedProviders: [] } };
  }
  try {
    return await collectLive();
  } catch (err) {
    console.error("[collector] live collection failed, using stored signals:", err);
    const sigs = await Repo.signals();
    return {
      signals: sigs,
      docsByProvider: {},
      meta: { live: true, providersUsed: [], usedLLM: false, queriesRun: 0, docsFound: 0, complianceNotes: {}, failedProviders: ["*"] },
    };
  }
}

export async function collectSignals(): Promise<Signal[]> {
  return (await collectSignalsDetailed()).signals;
}

/**
 * Which providers to fan out across. Resolved fresh per refresh so admin
 * toggles take effect without a redeploy.
 */
async function activeProviders(): Promise<SearchProvider[]> {
  const cfg = await Repo.config();
  const enabled = (cfg as { enabledProviders?: string[] }).enabledProviders;
  const base = enabled && enabled.length > 0
    ? enabled.map((id) => ALL_PROVIDERS[id]).filter(Boolean)
    : Object.values(ALL_PROVIDERS);
  // Always include the primary for the user's configured default ordering,
  // but never duplicate.
  const primary = selectProvider();
  if (!base.find((p) => p.id === primary.id)) base.push(primary);
  return base;
}

async function collectLive(): Promise<CollectionResult> {
  const cfg = await Repo.config();
  const cities = (await Repo.cities()).filter((c) => c.active);
  const providers = await activeProviders();
  const fallback = fallbackChain();
  const months = 3;

  // --- Fan-out: one sub-task per (provider × city × lens) -----------------
  const tasks: {
    provider: SearchProvider;
    query: string;
    city: string;
    country: string;
  }[] = [];
  for (const provider of providers) {
    for (const c of cities) {
      for (const lens of LENSES) {
        tasks.push({ provider, query: `${c.name} ${lens}`, city: c.name, country: c.country });
      }
    }
  }

  // --- Per-provider doc buffers + URL-level dedup across all providers -----
  const docsByProvider: Record<string, RawDoc[]> = {};
  for (const p of providers) docsByProvider[p.id] = [];
  const seen = new Set<string>();
  let queriesRun = 0;
  const failedProviders = new Set<string>();

  // --- Parallel-with-bounded-concurrency execution -----------------------
  // We bound at 6 in-flight calls so we don't blow the GitHub keyless tier
  // or hit Tavily/QPS caps with a 6-city × 6-lens × 4-provider fan-out
  // (~144 queries). GitHub's token bucket caps it further inside its own
  // provider.
  const CONC = 6;
  for (let i = 0; i < tasks.length; i += CONC) {
    const batch = tasks.slice(i, i + CONC);
    const results = await Promise.allSettled(
      batch.map((t) =>
        searchWithFallback(
          // try this provider first, then the fallback chain (minus self)
          [t.provider, ...fallback.filter((p) => p.id !== t.provider.id)],
          t.query,
          { city: t.city, country: t.country, timespanMonths: months },
        ).then((docs) => ({ provider: t.provider, docs })),
      ),
    );
    queriesRun += batch.length;
    if (i + CONC < tasks.length) await sleep(250);

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status !== "fulfilled") {
        failedProviders.add(batch[j].provider.id);
        continue;
      }
      const { provider, docs } = r.value;
      for (const d of docs) {
        const key = d.url.split("?")[0];
        if (seen.has(key)) continue;
        seen.add(key);
        // Only attribute to the primary provider for this sub-task. The
        // fallback chain is a reliability mechanism, not a co-credit.
        docsByProvider[provider.id] = docsByProvider[provider.id] || [];
        docsByProvider[provider.id].push(d);
      }
    }
  }

  // --- Extract structured signals (LLM or heuristic) ----------------------
  // Flatten for the extractor. Track source-provider provenance on each
  // doc so the extractor can stamp it into the resulting Signal.
  const flat: (RawDoc & { providerId: string })[] = [];
  for (const [pid, list] of Object.entries(docsByProvider)) {
    for (const d of list) flat.push({ ...d, providerId: pid });
  }
  const { signals, usedLLM } = await extractInBatches(flat);
  // Stamp provenance onto every extracted signal.
  for (const s of signals) {
    const src = (s as { sourceUrl?: string }).sourceUrl || s.url;
    const pid = (flat.find((d) => d.url.split("?")[0] === src.split("?")[0]) || {}).providerId;
    if (pid) (s as Signal & { providers?: string[] }).providers = Array.from(new Set([...(((s as Signal & { providers?: string[] }).providers) || []), pid]));
  }

  const docsFound = Object.values(docsByProvider).reduce((n, l) => n + l.length, 0);
  const complianceNotes: Record<string, string> = {};
  for (const p of providers) complianceNotes[p.id] = p.complianceNote;

  return {
    signals,
    docsByProvider,
    meta: {
      live: true,
      providersUsed: providers.map((p) => p.id),
      usedLLM,
      queriesRun,
      docsFound,
      complianceNotes,
      failedProviders: Array.from(failedProviders),
    },
  };
}

async function searchWithFallback(
  chain: SearchProvider[],
  query: string,
  opts: { city: string; country: string; timespanMonths: number },
): Promise<RawDoc[]> {
  for (const provider of chain) {
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

async function extractInBatches(docs: (RawDoc & { providerId?: string })[]): Promise<{ signals: Signal[]; usedLLM: boolean }> {
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
