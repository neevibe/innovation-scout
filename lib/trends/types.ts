// ---------------------------------------------------------------------------
// Trend Intelligence — the signal layer that feeds the opportunity engine.
// Answers: what's trending, where, how fast, and does it matter for BLR?
// ---------------------------------------------------------------------------

export type PlatformId =
  | "instagram"
  | "x"
  | "facebook"
  | "search"
  | "youtube"
  | "reddit"
  | "news";

export type TrendCategory =
  | "Beauty"
  | "F&B"
  | "Fashion"
  | "Travel"
  | "Retail"
  | "Technology"
  | "Wellness"
  | "Culture";

export type GeoId = "global" | "asia" | "india" | "bengaluru";

export type Lifecycle = "Emerging" | "Accelerating" | "Peak" | "Cooling" | "Declining";

export type Verdict = "Act now" | "Pilot" | "Watch" | "Low relevance";

// What a platform connector can currently do.
//  live         — measured this sweep from the platform's own public data
//  proxy        — measured from a stand-in source (stated in `sourceLabel`)
//  disconnected — needs credentials; no number is shown (never estimated)
export type ConnectorMode = "live" | "proxy" | "disconnected";

export interface PlatformStatus {
  id: PlatformId;
  label: string;
  mode: ConnectorMode;
  sourceLabel: string; // what actually produced the number
  howToConnect?: string; // shown when disconnected
}

// One trend × one platform.
export interface PlatformReading {
  intensity: number | null; // 0-100, normalised across the cohort (null = not measured)
  velocity: number | null; // ratio recent / baseline (1 = flat)
  raw?: Record<string, number>; // underlying measurements, for audit
}

export interface EvidenceItem {
  platform: PlatformId;
  title: string;
  url: string;
  source?: string;
  date?: string;
  metric?: string; // e.g. "2.1M views"
}

export interface TrendDefinition {
  id: string;
  name: string;
  category: TrendCategory;
  query: string; // search phrase used on every platform
  wiki?: string; // English Wikipedia article (search-interest proxy)
  // Analyst layer: how the trend converts into BLR commercial value.
  blr: {
    fit: number; // 0-100 analyst fit for an airport format
    play: string; // the concrete commercial move
    zone: string; // where in BLR it lives
    vertical: string;
    links?: { label: string; href: string }[]; // into the opportunity layer
  };
}

export interface TrendRecord extends TrendDefinition {
  platforms: Record<PlatformId, PlatformReading>;
  geo: Record<GeoId, number | null>; // 0-100 geo intensity (news-edition based)
  geoRaw: Record<GeoId, number | null>;
  series: number[]; // daily search-interest series (oldest → newest), for sparklines
  momentum: number; // 0-100 — mean intensity across measured platforms
  velocityScore: number; // 0-100 — 50 = flat, >62 accelerating
  breadth: number; // 0-1 — share of measured platforms where it's ≥ Medium
  overall: number; // 0-100 headline trend score
  lifecycle: Lifecycle;
  spread: "cross-platform" | "platform-specific" | "mixed";
  dominantPlatform: PlatformId | null;
  blrRelevance: number; // 0-100
  verdict: Verdict;
  evidence: EvidenceItem[];
}

export interface TrendingNowItem {
  geo: string; // e.g. "IN"
  title: string;
  traffic?: string; // Google's approximate traffic bucket, e.g. "20K+"
  url?: string;
  news?: string; // lead headline
  commercial: boolean; // heuristic: touches a consumer/commercial category
  at?: string;
}

export interface TrendSnapshot {
  generatedAt: string;
  windowDays: number;
  collector: string; // how this sweep was produced
  platforms: PlatformStatus[];
  trends: TrendRecord[];
  trendingNow: TrendingNowItem[];
  notes: string[];
}
