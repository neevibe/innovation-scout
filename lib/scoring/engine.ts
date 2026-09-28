import type {
  FactorScores,
  ScoringWeights,
  OpportunityTier,
  Opportunity,
  ScoutConfig,
  FactorKey,
} from "@/lib/types";

// Default weights (spec §10). Must sum to 100.
export const DEFAULT_WEIGHTS: ScoringWeights = {
  marketMomentum: 15,
  passengerRelevance: 15,
  commercialPotential: 20,
  strategicFit: 15,
  competitiveGap: 10,
  brandStrength: 10,
  implementationFeasibility: 5,
  evidenceConfidence: 5,
  innovationDifferentiation: 5,
};

export const FACTOR_LABELS: Record<FactorKey, string> = {
  marketMomentum: "Market Momentum",
  passengerRelevance: "Passenger Relevance",
  commercialPotential: "Commercial Potential",
  strategicFit: "Strategic Fit with BIAL",
  competitiveGap: "Competitive Gap",
  brandStrength: "Brand Strength",
  implementationFeasibility: "Implementation Feasibility",
  evidenceConfidence: "Evidence Confidence",
  innovationDifferentiation: "Innovation / Differentiation",
};

/** Normalise weights so they always sum to 100 (admin edits stay valid). */
export function normaliseWeights(w: ScoringWeights): ScoringWeights {
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const out = {} as ScoringWeights;
  (Object.keys(w) as FactorKey[]).forEach((k) => {
    out[k] = (w[k] / total) * 100;
  });
  return out;
}

/** Weighted 0-100 opportunity score from factor sub-scores (0-100 each). */
export function computeScore(factors: FactorScores, weights: ScoringWeights): number {
  const w = normaliseWeights(weights);
  let sum = 0;
  (Object.keys(factors) as FactorKey[]).forEach((k) => {
    sum += (factors[k] * w[k]) / 100;
  });
  return Math.round(sum);
}

export function tierForScore(score: number, cfg: ScoutConfig): OpportunityTier {
  const t = cfg.thresholds;
  if (score >= t.immediate) return "Immediate";
  if (score >= t.highPotential) return "High Potential";
  if (score >= t.monitor) return "Monitor";
  return "Low Priority";
}

export const TIER_META: Record<OpportunityTier, { emoji: string; label: string; color: string; hi: string }> = {
  Immediate: { emoji: "🚨", label: "Immediate Opportunity", color: "#F0B429", hi: "#FFD87A" },
  "High Potential": { emoji: "🔥", label: "High Potential", color: "#FF7A45", hi: "#FF9E6B" },
  Monitor: { emoji: "🟡", label: "Monitor / Validate", color: "#7FD4FF", hi: "#B5E6FF" },
  "Low Priority": { emoji: "⚪", label: "Low Priority", color: "#5C6675", hi: "#98A2B1" },
};

// --- 2x2 Opportunity Matrix axes -------------------------------------------
// Attractiveness = market pull. Feasibility = how easily BIAL can execute.
export function attractiveness(factors: FactorScores): number {
  const parts = [
    factors.marketMomentum,
    factors.commercialPotential,
    factors.brandStrength,
    factors.competitiveGap,
    factors.innovationDifferentiation,
    factors.passengerRelevance,
  ];
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function feasibility(factors: FactorScores): number {
  const parts = [
    factors.implementationFeasibility,
    factors.strategicFit,
    factors.evidenceConfidence,
  ];
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export type MatrixQuadrant = "Do Now" | "Pilot" | "Quick Win" | "Deprioritise";

export function quadrant(factors: FactorScores, cfg: ScoutConfig): MatrixQuadrant {
  const a = attractiveness(factors) >= cfg.thresholds.matrixAttractiveness;
  const f = feasibility(factors) >= cfg.thresholds.matrixFeasibility;
  if (a && f) return "Do Now";
  if (a && !f) return "Pilot";
  if (!a && f) return "Quick Win";
  return "Deprioritise";
}

export const QUADRANT_META: Record<MatrixQuadrant, { emoji: string; blurb: string }> = {
  "Do Now": { emoji: "🚀", blurb: "High attractiveness + high feasibility" },
  Pilot: { emoji: "🔬", blurb: "High attractiveness + low feasibility" },
  "Quick Win": { emoji: "⚡", blurb: "Low attractiveness + high feasibility" },
  Deprioritise: { emoji: "❌", blurb: "Low attractiveness + low feasibility" },
};

// --- Convenience: decorate an opportunity with computed values -------------
export interface ScoredOpportunity extends Opportunity {
  score: number;
  tier: OpportunityTier;
  attractiveness: number;
  feasibility: number;
  quadrant: MatrixQuadrant;
}

export function scoreOpportunity(o: Opportunity, cfg: ScoutConfig): ScoredOpportunity {
  const score = o.sufficientEvidence ? computeScore(o.factors, cfg.weights) : 0;
  return {
    ...o,
    score,
    tier: tierForScore(score, cfg),
    attractiveness: attractiveness(o.factors),
    feasibility: feasibility(o.factors),
    quadrant: quadrant(o.factors, cfg),
  };
}

export function scoreAll(opps: Opportunity[], cfg: ScoutConfig): ScoredOpportunity[] {
  return opps
    .map((o) => scoreOpportunity(o, cfg))
    .sort((a, b) => b.score - a.score);
}
