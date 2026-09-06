import { NextResponse } from "next/server";
import { getMastery, recalcMastery } from "@/lib/agents/mastery-live";

export const dynamic = "force-dynamic";

// Focused live refresh using ONLY the providers that work keylessly from this
// network (arxiv, github, youtube) — skips tavily/gdelt/googlenews/reddit
// which require keys or are blocked here. Used to verify the multi-provider
// pipeline end-to-end without burning a 144-query budget.
export async function POST() {
  const result = await recalcMastery();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("recompute") === "1") {
    return POST();
  }
  const all = getMastery();
  return NextResponse.json({ ok: true, totalEntries: all.length, top: all.slice(0, 5) });
}
