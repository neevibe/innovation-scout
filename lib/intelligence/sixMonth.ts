import type { BialPortfolioEntry, City, Signal } from "@/lib/types";
import type { ScoredOpportunity } from "@/lib/scoring/engine";

export const RESEARCH_WINDOW_LABEL = "19 Feb – 19 Aug 2026";
const WINDOW_START = new Date("2026-02-19T00:00:00.000Z").getTime();

// The source linked to sig-subko is dated March 2024, despite the locally
// seeded publication date. Keep the historical signal in the database, but
// do not portray it as current six-month evidence.
const EXCLUDED_FROM_SIX_MONTH_WINDOW = new Set(["sig-subko"]);

export interface CityPulse {
  city: City;
  signals: Signal[];
  focus: string;
  category: string;
  opportunityCount: number;
  topOpportunity?: ScoredOpportunity;
}

export interface BialGap {
  category: string;
  vertical: string;
  terminal: string;
  note: string;
  opportunity?: ScoredOpportunity;
}

function signalDate(signal: Signal): number {
  return new Date(signal.publishedAt || signal.firstDetectedAt).getTime();
}

/**
 * Produces the decision layer used across the app. The window is explicit so
 * leadership can distinguish recent signals from older background evidence.
 */
export function buildSixMonthReport(
  cities: City[],
  signals: Signal[],
  portfolio: BialPortfolioEntry[],
  opportunities: ScoredOpportunity[],
) {
  const recentSignals = signals
    .filter((signal) => signalDate(signal) >= WINDOW_START && !EXCLUDED_FROM_SIX_MONTH_WINDOW.has(signal.id))
    .sort((a, b) => signalDate(b) - signalDate(a));

  const cityPulses: CityPulse[] = cities.filter((city) => city.active).map((city) => {
    const citySignals = recentSignals
      .filter((signal) => signal.city === city.name)
      .sort((a, b) => b.confidence - a.confidence);
    const cityOpportunities = opportunities
      .filter((opportunity) => opportunity.city === city.name)
      .sort((a, b) => b.score - a.score);
    const lead = citySignals[0];

    return {
      city,
      signals: citySignals,
      focus: lead?.trend || "Monitoring for a distinct commercial signal",
      category: lead?.category || "Market watch",
      opportunityCount: cityOpportunities.length,
      topOpportunity: cityOpportunities[0],
    };
  });

  const gaps: BialGap[] = portfolio
    .filter((entry) => !entry.present)
    .map((entry) => {
      const opportunity = opportunities
        .filter((item) => item.recommendation.bialGap.toLowerCase().includes(entry.category.toLowerCase().slice(0, 14)))
        .sort((a, b) => b.score - a.score)[0]
        || opportunities
          .filter((item) => item.vertical === entry.vertical)
          .sort((a, b) => b.score - a.score)[0];
      return { ...entry, note: entry.note || "Portfolio gap identified in the BIAL reference set.", opportunity };
    })
    .sort((a, b) => (b.opportunity?.score || 0) - (a.opportunity?.score || 0));

  return {
    windowLabel: RESEARCH_WINDOW_LABEL,
    recentSignals,
    cityPulses,
    gaps,
    immediateCount: opportunities.filter((item) => item.tier === "Immediate").length,
  };
}
