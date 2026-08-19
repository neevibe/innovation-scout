import type { Signal, Opportunity, StoreShape, RefreshLogEntry, Vertical, SignalType } from "@/lib/types";
import { read, mutate, Repo } from "@/lib/db/store";
import { collectSignals, collectSignalsDetailed, type CollectionResult } from "@/lib/agents/collector";

// ===========================================================================
// Agent orchestration
// The system is composed of specialised agents (spec §20), not one big prompt.
// Each agent is a pure-ish function over the store. Live mode swaps the
// collector + research agents for real web/LLM calls (see collector.ts).
// ===========================================================================

// --- Agent 1: Scout — discover new raw signals ----------------------------
export async function scoutAgent(): Promise<Signal[]> {
  // In offline mode this returns the already-collected/seeded signals.
  // In live mode collectSignals() runs real web/news/social queries.
  return collectSignals();
}

// --- Agent 2/3: Research + Trend — classify & confirm a signal is a trend --
export function classifySignal(s: Signal): { vertical: Vertical; signalType: SignalType; isTrend: boolean } {
  // Deterministic classification heuristics (offline). Live mode uses an LLM
  // with structured output; the shape returned is identical.
  // A signal is a "trend" worth surfacing if it clears a confidence floor from
  // a non-social source, OR has any corroboration, OR comes from Tier 1-2.
  const isTrend =
    s.sourceTier <= 2 ||
    s.corroboratingUrls.length > 0 ||
    (s.confidence >= 45 && s.sourceTier <= 3);
  return { vertical: s.category, signalType: s.signalType, isTrend };
}

// --- Agent 4: Competitive Intelligence — compare vs peer airports/cities ---
export async function competitiveContext(brand: string): Promise<string[]> {
  const skus = await Repo.dutyFreeSkus();
  return skus
    .filter((k) => k.brand.toLowerCase().includes(brand.toLowerCase()))
    .flatMap((k) => k.presentAtPeers.filter((p) => p !== "—"));
}

// --- Agent 5: Gap Analysis — compare against BIAL portfolio ----------------
export async function gapAgent(): Promise<{ category: string; vertical: Vertical; missing: boolean }[]> {
  const portfolio = await Repo.portfolio();
  return portfolio.map((p) => ({ category: p.category, vertical: p.vertical, missing: !p.present }));
}

// --- Dedup / consolidation -------------------------------------------------
// If N publications describe the same development, consolidate into ONE event.
export function consolidate(signals: Signal[]): { consolidated: Signal[]; duplicatesRemoved: number } {
  const byKey = new Map<string, Signal>();
  let duplicatesRemoved = 0;
  for (const s of signals) {
    const existing = byKey.get(s.dedupeKey);
    if (!existing) {
      byKey.set(s.dedupeKey, { ...s });
    } else {
      // merge corroborating sources, keep highest confidence + earliest firstDetected
      const mergedUrls = Array.from(new Set([...existing.corroboratingUrls, ...s.corroboratingUrls, s.url]));
      existing.corroboratingUrls = mergedUrls.filter((u) => u !== existing.url);
      existing.confidence = Math.max(existing.confidence, s.confidence);
      existing.sourceTier = Math.min(existing.sourceTier, s.sourceTier) as Signal["sourceTier"];
      existing.lastUpdatedAt = new Date().toISOString();
      duplicatesRemoved++;
    }
  }
  return { consolidated: Array.from(byKey.values()), duplicatesRemoved };
}

// --- Agents 6/7/9: Opportunity + Scoring + Recommendation ------------------
// In the MVP, opportunities are authored/enriched objects tied to signals.
// The scoring math lives in scoring/engine.ts (configurable). Live mode's
// Recommendation Agent generates the structured recommendation via LLM using
// ONLY retrieved evidence (anti-hallucination: no evidence => sufficientEvidence=false).
export function evidenceSufficient(o: Opportunity): boolean {
  const independent = o.evidence.filter((e) => e.role !== "BIAL Internal Data").length;
  return independent >= 2 && o.contacts !== undefined;
}

// --- Orchestrator: full pipeline pass --------------------------------------
export interface RefreshResult {
  entry: RefreshLogEntry;
  store: StoreShape;
}

export async function runPipeline(): Promise<RefreshResult> {
  const cfg = await Repo.config();

  // 1. SCOUT — discover (captures provider/LLM/coverage meta in live mode)
  const collection: CollectionResult = await collectSignalsDetailed();
  const raw = collection.signals;

  // 2-3. RESEARCH + TREND — classify & keep only genuine trends
  const trends = raw.filter((s) => classifySignal(s).isTrend);

  // 4. DEDUP — consolidate multi-source stories into single events
  const { consolidated, duplicatesRemoved } = consolidate(trends);

  // 5-9. Gap / relevance / scoring / recommendation are reflected in the
  // opportunity objects; here we recompute freshness + evidence flags and
  // reconcile new signals into the store.
  const before = await read();
  const existingIds = new Set(before.signals.map((s) => s.id));
  const newSignals = consolidated.filter((s) => !existingIds.has(s.id));

  const store = await mutate((d) => {
    // upsert consolidated signals
    for (const s of consolidated) {
      const idx = d.signals.findIndex((x) => x.id === s.id);
      if (idx === -1) d.signals.push(s);
      else d.signals[idx] = { ...d.signals[idx], ...s, lastUpdatedAt: new Date().toISOString() };
    }
    // re-evaluate anti-hallucination flag on every opportunity
    for (const o of d.opportunities) {
      o.sufficientEvidence = evidenceSufficient(o);
    }
    // reflect the actual runtime collection mode in stored config
    d.config.mode = collection.meta.live ? "live" : "offline";
  });

  const m = collection.meta;
  const liveNotes = m.live
    ? `Live pass via ${m.provider ?? "provider"} · ${m.queriesRun ?? 0} queries · ${m.docsFound ?? 0} docs · extraction: ${m.usedLLM ? "LLM" : "heuristic"}.${m.complianceNote ? ` [${m.complianceNote}]` : ""}`
    : "Offline pass: re-scanned collected signals, consolidated duplicates, revalidated evidence flags. Set SCOUT_MODE=live to collect fresh signals.";

  const entry: RefreshLogEntry = {
    at: new Date().toISOString(),
    mode: m.live ? "live" : cfg.mode,
    signalsScanned: raw.length,
    signalsNew: newSignals.length,
    duplicatesConsolidated: duplicatesRemoved,
    opportunitiesCreated: 0,
    opportunitiesUpdated: store.opportunities.length,
    notes: liveNotes,
  };
  await Repo.addRefreshLog(entry);

  return { entry, store };
}
