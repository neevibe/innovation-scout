import { NextResponse } from "next/server";
import { Repo } from "@/lib/db/store";
import { scoreAll } from "@/lib/scoring/engine";

export const dynamic = "force-dynamic";

// AI Scout query — answers over the REAL collected intelligence (no fabrication).
// Deterministic retrieval + synthesis today; drop in an LLM over these same
// retrieved results when AI_GATEWAY_API_KEY is configured.
export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  const q = (query || "").toLowerCase().trim();
  const [config, signalsRaw, opps, cities] = await Promise.all([
    Repo.config(), Repo.signals(), Repo.opportunities(), Repo.cities(),
  ]);
  const scored = scoreAll(opps, config);

  const tokens = q.split(/[^a-z0-9&]+/).filter((t) => t.length > 2 && !STOP.has(t));
  const match = (text: string) => {
    const t = text.toLowerCase();
    if (tokens.length === 0) return true;
    return tokens.some((tok) => t.includes(tok));
  };

  const oppText = (o: (typeof scored)[number]) =>
    [o.brand, o.company, o.vertical, o.category, o.city, o.country, o.title, o.recommendation.marketSignal, o.recommendation.whyNow, ...o.tags].join(" ");
  const sigText = (s: (typeof signalsRaw)[number]) =>
    [s.brand, s.company, s.category, s.subCategory, s.city, s.country, s.signalType, s.trend, s.description].filter(Boolean).join(" ");

  const matchedOpps = scored.filter((o) => match(oppText(o))).slice(0, 6);
  const matchedSignals = signalsRaw.filter((s) => match(sigText(s))).slice(0, 8);

  const cityHits = cities.filter((c) => tokens.some((t) => c.name.toLowerCase().includes(t))).map((c) => c.name);
  const scannedSources = new Set(signalsRaw.map((s) => s.source)).size;

  const top = matchedOpps[0];
  const summary = matchedOpps.length
    ? `Found ${matchedOpps.length} scored ${matchedOpps.length === 1 ? "opportunity" : "opportunities"} and ${matchedSignals.length} supporting ${matchedSignals.length === 1 ? "signal" : "signals"}${cityHits.length ? ` across ${cityHits.join(", ")}` : ""}. ` +
      (top ? `Highest-scoring is ${top.brand} (${top.score}/100, ${top.tier}) — ${top.recommendation.bialRecommendation}` : "")
    : `No scored opportunities matched that query yet. ${matchedSignals.length} raw signals reference it — worth validating before BIAL acts.`;

  return NextResponse.json({
    ok: true,
    query,
    stats: {
      sourcesScanned: scannedSources,
      signalsAnalysed: signalsRaw.length,
      citiesCompared: cities.length,
      opportunitiesScored: opps.length,
    },
    summary,
    opportunities: matchedOpps.map((o) => ({
      id: o.id, brand: o.brand, vertical: o.vertical, city: o.city, score: o.score, tier: o.tier,
      why: o.recommendation.whyNow, action: o.recommendation.recommendedNextAction, image: o.image,
    })),
    signals: matchedSignals.map((s) => ({ id: s.id, brand: s.brand, city: s.city, trend: s.trend, type: s.signalType, url: s.url, source: s.source, confidence: s.confidence })),
  });
}

const STOP = new Set(["the","what","which","are","for","and","new","should","consider","that","have","has","been","last","days","our","across","emerged","emerging","brands","brand","concepts","doing","isnt","competitors"]);
