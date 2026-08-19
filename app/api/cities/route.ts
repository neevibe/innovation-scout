import { NextResponse } from "next/server";
import { Repo } from "@/lib/db/store";
import type { City } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, cities: await Repo.cities() });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { cities?: City[] };
  if (!body.cities) return NextResponse.json({ ok: false, error: "cities required" }, { status: 400 });
  const cities = await Repo.setCities(body.cities);
  return NextResponse.json({ ok: true, cities });
}
