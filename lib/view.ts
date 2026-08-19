import { Repo } from "@/lib/db/store";
import { scoreAll, type ScoredOpportunity } from "@/lib/scoring/engine";
import type { ScoutConfig } from "@/lib/types";

export interface PageData {
  config: ScoutConfig;
  opportunities: ScoredOpportunity[];
}

export async function getPageData(): Promise<PageData> {
  const [config, opportunities] = await Promise.all([Repo.config(), Repo.opportunities()]);
  return { config, opportunities: scoreAll(opportunities, config) };
}
