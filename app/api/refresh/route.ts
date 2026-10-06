import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents";
import { expireLiveFeed, getLiveFeed } from "@/lib/signals/live";

export const dynamic = "force-dynamic";
// Live collection (Tavily fan-out across 6 cities × 6 lenses) measured ~11s
// locally; give it headroom on Vercel's serverless clock. Fluid Compute /
// Pro plans allow up to 300s — 60s covers this with margin without needing
// a paid-tier bump.
export const maxDuration = 300;

// Manual refresh. The same handler is what a Vercel Cron would hit for the
// automated refresh (see spec §7 monitoring engine).
export async function POST() {
  const { entry } = await runPipeline();
  expireLiveFeed();
  await getLiveFeed().catch(() => null); // re-warm so /signals never pays the cold start
  return NextResponse.json({ ok: true, entry });
}

export async function GET() {
  const { entry } = await runPipeline();
  expireLiveFeed();
  await getLiveFeed().catch(() => null);
  return NextResponse.json({ ok: true, entry });
}
