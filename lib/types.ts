// ===========================================================================
// AI Innovation Scout — core domain model
// External intelligence is kept structurally separate from BIAL internal data.
// ===========================================================================

// Domains are intentionally broad: BIAL commercial intelligence covers ANY
// business, product, SKU, service, experience, technology or idea — not just
// F&B / retail / duty free.
export type Vertical =
  | "Retail"
  | "F&B"
  | "Duty Free"
  | "Products & SKUs"
  | "Services"
  | "Experiences"
  | "Technology"
  | "Wellness"
  | "Travel Services"
  | "Media & Advertising";

export type SignalType =
  | "Emerging Brand"
  | "Emerging Concept"
  | "Category Growth"
  | "Airport Innovation"
  | "Commercial Gap"
  | "Competitive Movement"
  | "Partnership Opportunity";

export type SourceTier = 1 | 2 | 3 | 4; // 1 = Official, 2 = High-quality media, 3 = Industry, 4 = Social

export type OpportunityStage =
  | "Discovered"
  | "Validated"
  | "Contact Identified"
  | "BIAL Outreach"
  | "Discussion"
  | "Commercial Evaluation"
  | "Pilot"
  | "Approved"
  | "Implementation"
  | "Live"
  | "Measured";

export type CommercialPotential = "Low" | "Medium" | "High" | "Very High";
export type Complexity = "Low" | "Medium" | "High";

// --- Geography (admin-configurable) ---------------------------------------
export interface City {
  id: string;
  name: string;
  country: string;
  kind: "domestic" | "international";
  benchmarkAirport?: string; // peer hub used for competitive comparison
  rationale: string; // why this city is in the pilot (passenger / benchmark relevance)
  active: boolean;
  // Why this city was selected — real BLR flight connectivity, with sources.
  connectivity?: {
    rank: string; // e.g. "#1 domestic route from BLR"
    metric: string; // e.g. "~2,249 flights/mo · 477k seats"
    detail?: string; // extra colour (airlines / daily frequency)
    sources: { label: string; url: string; kind: "web" | "aviation-data" | "news" | "social" }[];
  };
}

// --- Evidence -------------------------------------------------------------
export interface EvidenceItem {
  id: string;
  role:
    | "Original Source"
    | "Independent Confirmation"
    | "Market/Consumer Signal"
    | "Comparable Airport/City"
    | "BIAL Internal Data";
  title: string;
  publisher: string;
  url: string;
  tier: SourceTier;
  publishedAt?: string; // ISO date
  excerpt: string;
}

// --- Raw signal (output of the collection + extraction layer) -------------
export interface Signal {
  id: string;
  timestamp: string; // when ingested
  firstDetectedAt: string;
  lastUpdatedAt: string;
  publishedAt?: string;
  source: string;
  url: string;
  city: string; // City.name
  country: string;
  airport?: string;
  brand?: string;
  company?: string;
  category: Vertical;
  subCategory: string;
  signalType: SignalType;
  trend: string; // short trend label
  event?: string; // activation / launch event
  description: string;
  confidence: number; // 0-100
  sourceTier: SourceTier;
  // signals that were consolidated into this one (dedup): their source URLs
  corroboratingUrls: string[];
  dedupeKey: string; // brand|city|trend fingerprint used to consolidate
  opportunityId?: string; // linked opportunity, if promoted
}

// --- Scoring --------------------------------------------------------------
// Nine configurable factors (spec §10). Sub-scores are 0-100.
export interface FactorScores {
  marketMomentum: number;
  passengerRelevance: number;
  commercialPotential: number;
  strategicFit: number;
  competitiveGap: number;
  brandStrength: number;
  implementationFeasibility: number;
  evidenceConfidence: number;
  innovationDifferentiation: number;
}

export type FactorKey = keyof FactorScores;

export interface ScoringWeights {
  marketMomentum: number;
  passengerRelevance: number;
  commercialPotential: number;
  strategicFit: number;
  competitiveGap: number;
  brandStrength: number;
  implementationFeasibility: number;
  evidenceConfidence: number;
  innovationDifferentiation: number;
}

export type OpportunityTier =
  | "Immediate" // 80-100
  | "High Potential" // 65-79
  | "Monitor" // 50-64
  | "Low Priority"; // <50

// --- Contact intelligence -------------------------------------------------
export type ContactVerification = "Verified Public Business Contact" | "AI-Inferred Contact";

export interface Contact {
  id: string;
  verification: ContactVerification;
  personName?: string; // only when publicly attributable to a named source
  designation: string; // role we should approach (may be role-only, no person)
  company: string;
  linkedinUrl?: string; // company or public professional profile
  companyProfileUrl?: string;
  publicBusinessEmail?: string; // public channel only (e.g. partnerships@)
  publicBusinessPhone?: string;
  companyWebsite?: string;
  sourceUrl?: string; // where this attribution came from
  confidence: number; // 0-100
  note?: string;
}

// --- Recommendation -------------------------------------------------------
export interface Recommendation {
  opportunity: string;
  marketSignal: string;
  whyNow: string;
  bialGap: string;
  bialRecommendation: string;
  potentialLocation: string;
  targetPassenger: string;
  commercialPotential: CommercialPotential;
  implementationComplexity: Complexity;
  expectedStrategicValue: string;
  recommendedNextAction: string;
}

// --- Opportunity (the central product object) -----------------------------
export interface Opportunity {
  id: string;
  title: string;
  brand: string;
  company: string;
  vertical: Vertical;
  category: string;
  city: string;
  country: string;
  signalType: SignalType;
  factors: FactorScores;
  // score is computed from factors + active weights (not stored) — see scoring/engine.ts
  recommendation: Recommendation;
  evidence: EvidenceItem[];
  contacts: Contact[];
  signalIds: string[];
  stage: OpportunityStage;
  createdAt: string;
  updatedAt: string;
  sufficientEvidence: boolean; // false => surfaced as INSUFFICIENT EVIDENCE, no confident rec
  tags: string[];
  image?: string; // representative category photo (licensed stock, not the brand's own)
  imageAlt?: string;
  buzz?: BuzzProfile; // longevity / momentum of the buzz — distinguishes spikes from sustained trends
}

// Tracks HOW LONG and HOW STRONGLY a brand/concept has trended over the window.
// Prevents "one-month spike" picks from being treated like durable trends.
export type BuzzTrajectory = "Emerging" | "Accelerating" | "Sustained" | "Plateauing" | "Fading" | "Spike-and-fade";

export interface BuzzProfile {
  windowMonths: number; // observation window (e.g. 6)
  firstSeen: string; // ISO month first detected
  monthsActive: number; // in how many of the window months it showed measurable buzz
  monthly: number[]; // per-month buzz index 0-100 across the window (oldest → newest)
  persistence: number; // monthsActive / windowMonths (0-1)
  trajectory: BuzzTrajectory;
  note: string; // human-readable justification of the trajectory call
}

// --- Market shortlist candidate (the ≥10-per-market coverage layer) --------
// Lighter than a full Opportunity: every buzzing brand in a market, scored and
// buzz-profiled with sources, so the pick set is auditable. Top candidates get
// promoted to full Opportunities.
export interface MarketCandidate {
  id: string;
  city: string;
  brand: string;
  company?: string;
  vertical: Vertical;
  category: string;
  score: number; // 0-100 composite (same model as opportunities)
  buzz: BuzzProfile;
  why: string; // the trending evidence — why it's on the shortlist
  bialFit: string; // how BIAL could bring it here
  airportPrecedent?: boolean; // already live in an airport somewhere
  sources: { label: string; url: string; tier: SourceTier }[];
  promotedOpportunityId?: string;
}

// --- BIAL internal reference data (kept separate) -------------------------
export interface BialPortfolioEntry {
  category: string;
  vertical: Vertical;
  terminal: "T1" | "T2" | "Both";
  present: boolean;
  brandsPresent: string[];
  note?: string;
}

export interface DutyFreeSku {
  category: string;
  brand: string;
  presentAtBial: boolean;
  presentAtPeers: string[]; // peer airports carrying it
  note?: string;
}

// --- Config ---------------------------------------------------------------
export interface ScoutConfig {
  weights: ScoringWeights;
  thresholds: {
    immediate: number; // default 80
    highPotential: number; // default 65
    monitor: number; // default 50
    matrixAttractiveness: number; // matrix split, default 60
    matrixFeasibility: number; // default 60
  };
  monitoringFrequencyHours: number;
  mode: "offline" | "live";
  lastRefreshAt?: string;
  /** Provider ids to fan out across in live mode. Unset/empty = all providers
   *  (see collector.ts activeProviders()). Scope this down for reliability —
   *  keyless providers (GDELT/GoogleNews/Reddit) are frequently blocked, and
   *  the full 7-provider fan-out across all cities can exceed serverless
   *  function timeouts. */
  enabledProviders?: string[];
}

// --- Store shape ----------------------------------------------------------
export interface StoreShape {
  config: ScoutConfig;
  cities: City[];
  signals: Signal[];
  opportunities: Opportunity[];
  candidates: MarketCandidate[];
  bialPortfolio: BialPortfolioEntry[];
  dutyFreeSkus: DutyFreeSku[];
  refreshLog: RefreshLogEntry[];
}

export interface RefreshLogEntry {
  at: string;
  mode: "offline" | "live";
  signalsScanned: number;
  signalsNew: number;
  duplicatesConsolidated: number;
  opportunitiesCreated: number;
  opportunitiesUpdated: number;
  notes: string;
}

// --- Roles (RBAC) ---------------------------------------------------------
export type Role =
  | "Super Admin"
  | "Commercial Leadership"
  | "Retail Team"
  | "F&B Team"
  | "Duty Free Team"
  | "Strategy Team"
  | "Analyst";
