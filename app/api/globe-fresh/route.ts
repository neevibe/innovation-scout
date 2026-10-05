import { NextResponse } from "next/server";
import { getReport, CDN_HEADERS } from "@/lib/freshness/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Live per-city evidence that replaces the globe's hard-coded signal cards.
export async function GET() {
  const r = await getReport();
  return NextResponse.json(r.globe, { headers: CDN_HEADERS });
}
