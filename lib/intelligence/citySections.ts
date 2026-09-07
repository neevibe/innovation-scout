import type {
  BialPortfolioEntry,
  City,
  CityBucketItem,
  CitySectionBreakdown,
  DutyFreeSku,
  MarketCandidate,
  Section,
  Signal,
  SourceTier,
  Vertical,
} from "@/lib/types";
import { SECTIONS } from "@/lib/types";
import type { ScoredOpportunity } from "@/lib/scoring/engine";

// ===========================================================================
// City deep-dive: buckets every known brand/trend for a city into the six
// business sections BIAL organises commercial around, scores each against
// what BIAL already has, and ranks the top 5 per section.
//
// A single real-world brand can legitimately appear in TWO buckets: its
// vertical-specific section (F&B / Retail / Duty Free / Experiences /
// Commercial Service) AND "Brands" if it's a genuinely emerging brand
// (signalType === "Emerging Brand") — "Brands" is a cross-cutting lens, not
// a seventh vertical. This mirrors how a commercial team would actually
// scan the market: "what's buzzing" vs "who's the buzzing new name".
// ===========================================================================

const VERTICAL_TO_SECTION: Record<Vertical, Section> = {
  "Retail": "Retail",
  "F&B": "F&B",
  "Duty Free": "Duty Free",
  "Products & SKUs": "Retail",
  "Services": "Commercial Service",
  "Experiences": "Experiences",
  "Technology": "Commercial Service",
  "Wellness": "Commercial Service",
  "Travel Services": "Commercial Service",
  "Media & Advertising": "Commercial Service",
};

function tierFeasibilityPoints(tier: SourceTier): number {
  return { 1: 100, 2: 75, 3: 50, 4: 25 }[tier];
}

/** Deterministic 0-100 "how feasible for BIAL to actually land this" score.
 *  Blended from source quality + confidence + corroboration + (when available)
 *  the opportunity's own implementationFeasibility/strategicFit factors and
 *  any proven airport precedent. This is a planning heuristic, not a fact —
 *  every consumer of it should show it as "feasibility (heuristic)". */
function computeFeasibility(opts: {
  sourceTier: SourceTier;
  confidence: number;
  corroborationCount: number;
  airportPrecedent?: boolean;
  opportunityFactors?: { implementationFeasibility: number; strategicFit: number };
}): number {
  const tierPts = tierFeasibilityPoints(opts.sourceTier);
  const corrobBonus = Math.min(opts.corroborationCount, 3) * 8;
  let base = tierPts * 0.4 + opts.confidence * 0.45 + corrobBonus * 0.15;
  if (opts.opportunityFactors) {
    const oppPts = (opts.opportunityFactors.implementationFeasibility + opts.opportunityFactors.strategicFit) / 2;
    base = base * 0.5 + oppPts * 0.5;
  }
  if (opts.airportPrecedent) base += 12;
  return Math.max(0, Math.min(100, Math.round(base)));
}

/** Is this brand already present in BIAL's own portfolio / duty-free set? */
function checkAtBial(
  brand: string | undefined,
  vertical: Vertical,
  portfolio: BialPortfolioEntry[],
  dutyFreeSkus: DutyFreeSku[],
): { atBial: boolean; bialNote: string } {
  const b = (brand || "").toLowerCase().trim();
  if (!b) {
    return { atBial: false, bialNote: "No specific brand named in this signal yet — monitor before concluding it's a gap." };
  }
  if (vertical === "Duty Free") {
    const sku = dutyFreeSkus.find((s) => s.brand.toLowerCase().includes(b) || b.includes(s.brand.toLowerCase()));
    if (sku?.presentAtBial) return { atBial: true, bialNote: `Already stocked at BIAL (${sku.category}).` };
    if (sku) return { atBial: false, bialNote: sku.note || `Not yet at BIAL — present at ${sku.presentAtPeers.join(", ") || "peer airports"} only.` };
  }
  const entry = portfolio.find((p) => p.brandsPresent.some((br) => br.toLowerCase() === b));
  if (entry) return { atBial: true, bialNote: `Already live at BIAL ${entry.terminal} (${entry.category}).` };
  const gapEntry = portfolio.find((p) => p.vertical === vertical && !p.present);
  if (gapEntry) return { atBial: false, bialNote: `BIAL has no ${gapEntry.category.toLowerCase()} presence yet — ${gapEntry.note || "open category gap"}.` };
  return { atBial: false, bialNote: "No matching brand found in BIAL's current portfolio or duty-free reference — treat as a white-space opportunity." };
}

function fromSignal(s: Signal, portfolio: BialPortfolioEntry[], dutyFreeSkus: DutyFreeSku[]): CityBucketItem {
  const { atBial, bialNote } = checkAtBial(s.brand, s.category, portfolio, dutyFreeSkus);
  return {
    id: s.id,
    kind: "signal",
    name: s.brand || s.trend,
    isNamedBrand: !!s.brand,
    vertical: s.category,
    city: s.city,
    score: s.confidence,
    feasibility: computeFeasibility({ sourceTier: s.sourceTier, confidence: s.confidence, corroborationCount: s.corroboratingUrls.length }),
    atBial,
    bialNote,
    why: s.description,
    sourceLabel: s.source,
    sourceUrl: s.url,
    confidence: s.confidence,
    opportunityId: s.opportunityId,
  };
}

function fromCandidate(c: MarketCandidate, portfolio: BialPortfolioEntry[], dutyFreeSkus: DutyFreeSku[]): CityBucketItem {
  const { atBial, bialNote } = checkAtBial(c.brand, c.vertical, portfolio, dutyFreeSkus);
  const primarySource = c.sources[0];
  return {
    id: c.id,
    kind: "candidate",
    name: c.brand,
    isNamedBrand: true, // MarketCandidate always carries a real curated brand name
    vertical: c.vertical,
    city: c.city,
    score: c.score,
    feasibility: computeFeasibility({
      sourceTier: primarySource?.tier ?? 3,
      confidence: c.score,
      corroborationCount: c.sources.length - 1,
      airportPrecedent: c.airportPrecedent,
    }),
    atBial: c.airportPrecedent ? atBial : atBial,
    bialNote: c.airportPrecedent && !atBial ? `${bialNote} (Note: already proven in an airport elsewhere, not at BIAL.)` : bialNote,
    why: c.why,
    sourceLabel: primarySource?.label || "Market research",
    sourceUrl: primarySource?.url || "#",
    confidence: c.score,
    opportunityId: c.promotedOpportunityId,
  };
}

function fromOpportunity(o: ScoredOpportunity, portfolio: BialPortfolioEntry[], dutyFreeSkus: DutyFreeSku[]): CityBucketItem {
  const { atBial, bialNote } = checkAtBial(o.brand, o.vertical, portfolio, dutyFreeSkus);
  const evidence = o.evidence[0];
  return {
    id: o.id,
    kind: "opportunity",
    name: o.brand,
    isNamedBrand: true, // a promoted Opportunity always has a real brand
    vertical: o.vertical,
    city: o.city,
    score: o.score,
    feasibility: computeFeasibility({
      sourceTier: evidence?.tier ?? 3,
      confidence: o.factors.evidenceConfidence,
      corroborationCount: o.evidence.length - 1,
      opportunityFactors: { implementationFeasibility: o.factors.implementationFeasibility, strategicFit: o.factors.strategicFit },
    }),
    atBial,
    bialNote,
    why: o.recommendation.marketSignal,
    sourceLabel: evidence?.publisher || "BIAL research",
    sourceUrl: evidence?.url || "#",
    confidence: o.factors.evidenceConfidence,
    opportunityId: o.id,
  };
}

/** Sections a bucket item belongs to. Vertical section always; "Brands" too
 *  when it reads as a genuinely named emerging brand (not a bare trend/category
 *  note) — heuristic: has a real name distinct from a generic trend label. */
function sectionsFor(item: CityBucketItem, isEmergingBrandSignal: boolean): Section[] {
  const primary = VERTICAL_TO_SECTION[item.vertical];
  const sections = new Set<Section>([primary]);
  if (isEmergingBrandSignal && item.isNamedBrand) sections.add("Brands");
  return Array.from(sections);
}

export function buildCitySectionBreakdown(
  city: City,
  signals: Signal[],
  candidates: MarketCandidate[],
  opportunities: ScoredOpportunity[],
  portfolio: BialPortfolioEntry[],
  dutyFreeSkus: DutyFreeSku[],
): CitySectionBreakdown {
  const citySignals = signals.filter((s) => s.city === city.name);
  const cityCandidates = candidates.filter((c) => c.city === city.name);
  const cityOpps = opportunities.filter((o) => o.city === city.name);

  // Dedupe by brand name (case-insensitive) so the same real brand doesn't
  // show up 3x from signal + candidate + promoted opportunity — richer data
  // always wins: Opportunity > MarketCandidate > raw Signal.
  const byBrand = new Map<string, CityBucketItem & { emergingBrand: boolean }>();

  for (const s of citySignals) {
    const key = (s.brand || s.trend).toLowerCase();
    const item = fromSignal(s, portfolio, dutyFreeSkus);
    const existing = byBrand.get(key);
    if (!existing || existing.kind === "signal") {
      byBrand.set(key, { ...item, emergingBrand: s.signalType === "Emerging Brand" });
    }
  }
  for (const c of cityCandidates) {
    const key = c.brand.toLowerCase();
    const item = fromCandidate(c, portfolio, dutyFreeSkus);
    const existing = byBrand.get(key);
    if (!existing || existing.kind === "signal") {
      byBrand.set(key, { ...item, emergingBrand: existing?.emergingBrand ?? true });
    }
  }
  for (const o of cityOpps) {
    const key = o.brand.toLowerCase();
    const item = fromOpportunity(o, portfolio, dutyFreeSkus);
    const existing = byBrand.get(key);
    byBrand.set(key, { ...item, emergingBrand: existing?.emergingBrand ?? (o.signalType === "Emerging Brand") });
  }

  const allItems = Array.from(byBrand.values());

  const sections: Record<Section, CityBucketItem[]> = {
    "Brands": [], "F&B": [], "Retail": [], "Duty Free": [], "Experiences": [], "Commercial Service": [],
  };
  for (const item of allItems) {
    for (const sec of sectionsFor(item, item.emergingBrand)) {
      sections[sec].push(item);
    }
  }
  for (const sec of SECTIONS) {
    sections[sec] = sections[sec].sort((a, b) => b.score - a.score).slice(0, 5);
  }

  return { city: city.name, sections };
}
