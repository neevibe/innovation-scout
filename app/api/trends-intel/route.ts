import { NextResponse } from "next/server";
import snapshot from "@/lib/data/trendsSnapshot.json";

// The Trend Intelligence signal layer as JSON — the page reads this snapshot and
// downstream agents (opportunity engine, brief) can consume it the same way.
// Refresh with `npm run trends` (see scripts/collectTrends.ts).
export async function GET() {
  return NextResponse.json(snapshot);
}
