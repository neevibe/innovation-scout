import { NextResponse } from "next/server";
import { getReport, CDN_HEADERS } from "@/lib/freshness/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The Scout Daily edition the globe console renders.
export async function GET() {
  const r = await getReport();
  return NextResponse.json(r.daily, { headers: CDN_HEADERS });
}
