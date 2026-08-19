import { NextResponse } from "next/server";
import { Repo } from "@/lib/db/store";
import type { ScoutConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await Repo.config();
  return NextResponse.json({ ok: true, config });
}

export async function PATCH(req: Request) {
  const patch = (await req.json().catch(() => ({}))) as Partial<ScoutConfig>;
  const config = await Repo.setConfig(patch);
  return NextResponse.json({ ok: true, config });
}
