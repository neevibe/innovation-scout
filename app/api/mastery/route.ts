import { NextResponse } from "next/server";
import { Repo } from "@/lib/db/store";
import { buildMasterySheet } from "@/lib/agents/mastery";

export const dynamic = "force-dynamic";

// Master answer sheet — every signal grouped by dedupeKey, with cross-source
// convergence verdict and full per-source URL attribution. Sorts by
// masteryScore desc so the front page of "what's true and agreed-upon"
// is the top of the response.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 25)));
  const verdictFilter = url.searchParams.get("verdict"); // strong | moderate | single | noise | null

  const signals = await Repo.signals();
  const all = buildMasterySheet(signals);

  const filtered = verdictFilter
    ? all.filter((e) => e.verdict === verdictFilter)
    : all;
  const top = filtered.slice(0, limit);

  // Summary so the UI can show a single-mastery number alongside the table.
  const summary = {
    totalEntries: all.length,
    byVerdict: all.reduce<Record<string, number>>((acc, e) => {
      acc[e.verdict] = (acc[e.verdict] || 0) + 1;
      return acc;
    }, {}),
    topScore: all[0]?.masteryScore ?? 0,
    topTopic: all[0]?.topic ?? null,
  };

  return NextResponse.json({ ok: true, summary, entries: top });
}
