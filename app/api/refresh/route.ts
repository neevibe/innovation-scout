import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents";

export const dynamic = "force-dynamic";

// Manual refresh. The same handler is what a Vercel Cron would hit for the
// automated refresh (see spec §7 monitoring engine).
export async function POST() {
  const { entry } = await runPipeline();
  return NextResponse.json({ ok: true, entry });
}

export async function GET() {
  const { entry } = await runPipeline();
  return NextResponse.json({ ok: true, entry });
}
