import { NextResponse } from "next/server";
import { Repo } from "@/lib/db/store";
import type { OpportunityStage } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAGES: OpportunityStage[] = [
  "Discovered", "Validated", "Contact Identified", "BIAL Outreach", "Discussion",
  "Commercial Evaluation", "Pilot", "Approved", "Implementation", "Live", "Measured",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, stage } = body as { id?: string; stage?: OpportunityStage };
  if (!id || !stage || !STAGES.includes(stage)) {
    return NextResponse.json({ ok: false, error: "id and valid stage required" }, { status: 400 });
  }
  const updated = await Repo.setStage(id, stage);
  if (!updated) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, opportunity: { id: updated.id, stage: updated.stage } });
}
