import type { BusinessPlan, City, CityBucketItem, MarketCandidate, Signal, Vertical } from "@/lib/types";
import type { ScoredOpportunity } from "@/lib/scoring/engine";

// ===========================================================================
// Business plan generator
// ---------------------------------------------------------------------------
// Triggered when a user clicks a bucket item that is NOT already at BIAL.
// Deterministic, template-assembled from the item's OWN evidence — never
// invents brand facts. Where a full Opportunity dossier already exists we
// reuse its human-authored recommendation verbatim (richest source). Where
// only a raw signal/candidate exists, we heuristically assemble a plan from
// its why/bialFit/description fields and label every generic commercial-
// model figure explicitly as a planning assumption, not a forecast.
// ===========================================================================

const FORMAT_BY_VERTICAL: Record<Vertical, string> = {
  "Retail": "Dedicated retail bay / shop-in-shop",
  "F&B": "Grab-and-go counter or sit-down concession",
  "Duty Free": "Duty-free SKU line or dedicated gifting bay",
  "Products & SKUs": "Curated SKU placement within an existing bay",
  "Services": "Service counter or kiosk",
  "Experiences": "Experiential pop-up or activation zone",
  "Technology": "Self-serve kiosk / digital touchpoint",
  "Wellness": "Wellness pod or dedicated unit",
  "Travel Services": "Travel-services counter (landside or airside)",
  "Media & Advertising": "Media/DOOH placement or branded takeover",
};

const LOCATION_BY_VERTICAL: Record<Vertical, string> = {
  "Retail": "Post-security retail corridor, high dwell-time zone",
  "F&B": "Pre-boarding F&B cluster or landside food court",
  "Duty Free": "Main duty-free hall, near boarding gates",
  "Products & SKUs": "Within an existing duty-free or retail bay",
  "Services": "Arrivals/departures concourse",
  "Experiences": "Central atrium or high-footfall activation zone",
  "Technology": "Self-serve zone near security/immigration",
  "Wellness": "Quiet zone near lounges or long-dwell gates",
  "Travel Services": "Arrivals hall or transit zone",
  "Media & Advertising": "High-visibility concourse or digital screen network",
};

function evidenceList(urls: { label: string; url: string }[]): { label: string; url: string }[] {
  return urls.filter((u) => u.url && u.url !== "#");
}

export function generateBusinessPlan(item: CityBucketItem, city: City, opportunity?: ScoredOpportunity): BusinessPlan {
  if (opportunity) return planFromOpportunity(item, city, opportunity);
  return planHeuristic(item, city);
}

function planFromOpportunity(item: CityBucketItem, city: City, o: ScoredOpportunity): BusinessPlan {
  return {
    itemId: item.id,
    title: `Bring ${o.brand} to BIAL — ${city.name}`,
    vertical: o.vertical,
    city: city.name,
    summary: o.recommendation.opportunity,
    marketSignal: o.recommendation.marketSignal,
    whyNow: o.recommendation.whyNow,
    bialGap: o.recommendation.bialGap,
    proposedFormat: FORMAT_BY_VERTICAL[o.vertical],
    targetLocation: o.recommendation.potentialLocation || LOCATION_BY_VERTICAL[o.vertical],
    targetPassenger: o.recommendation.targetPassenger,
    commercialModelNote: `Planning assumption only — commercial potential rated "${o.recommendation.commercialPotential}" and implementation complexity "${o.recommendation.implementationComplexity}" by the scoring model (factors: implementation feasibility ${o.factors.implementationFeasibility}/100, strategic fit ${o.factors.strategicFit}/100). Actual terms require direct commercial negotiation.`,
    phases: [
      { phase: "Validate", timeframe: "Weeks 1-2", actions: ["Confirm brand's India/APAC expansion appetite via the identified contact", "Cross-check space availability against the proposed location", "Align internally with the relevant category team (per Section)"] },
      { phase: "Engage", timeframe: "Weeks 3-6", actions: ["Initiate outreach using the contact record on this dossier", "Share BIAL passenger profile + footfall data relevant to the target passenger segment", "Request commercial terms (rent model, min guarantee, revenue share)"] },
      { phase: "Commercial Evaluation", timeframe: "Weeks 6-10", actions: ["Route through BIAL's standard commercial evaluation process", "Model P&L against comparable existing concessions", "Get sign-off from Commercial Leadership"] },
      { phase: "Pilot / Launch", timeframe: "Ongoing", actions: ["Negotiate a pilot term before full rollout if the format is unproven at BIAL", "Fit-out and launch at the proposed location", "Track dwell-time, spend-per-passenger and category cannibalisation post-launch"] },
    ],
    risks: [
      o.sufficientEvidence ? "Evidence is grounded in independent sources — standard commercial due diligence still required." : "INSUFFICIENT EVIDENCE flag is set — validate independently before committing budget.",
      "Space availability at the proposed location is not yet confirmed operationally.",
      "Commercial terms are unconfirmed — this plan does not represent an agreed deal.",
    ],
    nextAction: o.recommendation.recommendedNextAction,
    evidence: evidenceList(o.evidence.map((e) => ({ label: `${e.publisher} — ${e.title}`, url: e.url }))),
    generatedFrom: "opportunity",
  };
}

function planHeuristic(item: CityBucketItem, city: City): BusinessPlan {
  const candidateWhy = item.why;
  const title = item.isNamedBrand
    ? `Bring ${item.name} to BIAL — ${city.name}`
    : `Investigate: ${item.name} — ${city.name}`;
  const summary = item.isNamedBrand
    ? `${item.name} is buzzing in ${city.name} (${item.vertical}) and has no confirmed presence at BIAL. ${item.bialNote}`
    : `This is a category/trend signal, not yet a named brand BIAL could contact directly. ${item.bialNote} Read the source before treating this as an actionable lead.`;
  return {
    itemId: item.id,
    title,
    vertical: item.vertical,
    city: city.name,
    summary,
    marketSignal: candidateWhy,
    whyNow: `Confidence ${item.confidence}/100 from ${item.sourceLabel}. This has not yet been promoted to a full scored Opportunity dossier — treat this plan as a first-pass, not a validated recommendation.`,
    bialGap: item.bialNote,
    proposedFormat: FORMAT_BY_VERTICAL[item.vertical],
    targetLocation: LOCATION_BY_VERTICAL[item.vertical],
    targetPassenger: "Not yet segmented — infer from category precedent during validation.",
    commercialModelNote: `Planning assumption only — no commercial terms have been researched. Feasibility heuristic scored this ${item.feasibility}/100 based on source tier, confidence and corroboration; it is not a financial forecast.`,
    phases: [
      { phase: "Validate", timeframe: "Week 1", actions: [`Confirm ${item.name}'s current footprint and expansion plans beyond the single cited source`, "Identify a business development contact (none captured yet)", "Decide whether this warrants promotion to a full scored Opportunity"] },
      { phase: "Scope", timeframe: "Weeks 2-3", actions: ["Define the target format and location based on comparable concessions", "Estimate space and fit-out requirements", "Flag to the relevant category team for a first read"] },
      { phase: "Engage", timeframe: "Weeks 4+", actions: ["Reach out once a verifiable contact is identified", "Share BIAL's footfall/passenger data for the proposed location", "Request indicative commercial terms"] },
    ],
    risks: [
      "Single-source signal — not yet independently corroborated. Verify before committing time or budget.",
      "No business contact identified yet.",
      "Commercial terms and space availability are unresearched.",
    ],
    nextAction: `Validate this signal independently, then promote to a full Opportunity dossier if it holds up.`,
    evidence: evidenceList([{ label: item.sourceLabel, url: item.sourceUrl }]),
    generatedFrom: "heuristic",
  };
}

// Re-exported for API routes that only have the raw underlying record and
// need to reconstruct a CityBucketItem-shaped object ad hoc (kept here so
// the mapping logic — FORMAT_BY_VERTICAL etc. — has one home).
export type { Signal, MarketCandidate };
