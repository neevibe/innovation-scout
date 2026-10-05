import { NextResponse } from "next/server";
import { getReport } from "@/lib/freshness/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Freshness Agent. GET returns the latest audit + rebuilt content (running the
// agent if the edition is older than 12h). The daily Vercel cron and POST
// force a full run: audit → research → rebuild → re-audit.
export async function GET(req: Request) {
  const isCron = req.headers.get("user-agent")?.includes("vercel-cron");
  const r = await getReport({ force: isCron });
  return NextResponse.json({ ranAt: r.ranAt, durationMs: r.durationMs, provider: r.provider, audit: r.audit });
}

export async function POST() {
  const r = await getReport({ force: true });
  return NextResponse.json({ ranAt: r.ranAt, durationMs: r.durationMs, provider: r.provider, audit: r.audit });
}
