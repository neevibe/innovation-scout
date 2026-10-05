// Freshness Agent — CLI run.
//   npm run freshness            audit → live research → rebuild Daily + globe evidence
//   npm run freshness -- --trends  also re-collect the Trend Intelligence snapshot
// Writes lib/data/freshness.json (the committed fallback the API serves when live
// research is unavailable) and mirrors every resolved public image into
// public/scout-globe/brand-img/auto/ so the fallback never depends on hotlinks.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { runFreshnessAgent, type FreshnessReport } from "@/lib/freshness/agent";
import type { ResolvedImage } from "@/lib/freshness/images";

const OUT = "lib/data/freshness.json";
const IMG_DIR = "public/scout-globe/brand-img/auto";

async function mirror(img: ResolvedImage | null): Promise<ResolvedImage | null> {
  if (!img || img.url.startsWith("/")) return img;
  try {
    const res = await fetch(img.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BIAL-Scout-Freshness/1.0)" }, signal: AbortSignal.timeout(15000) });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/")) return img;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3_000_000) return img; // keep the repo lean
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("svg") ? "svg" : "jpg";
    const name = createHash("sha1").update(img.url).digest("hex").slice(0, 12) + "." + ext;
    writeFileSync(path.join(IMG_DIR, name), buf);
    return { ...img, url: `/scout-globe/brand-img/auto/${name}` };
  } catch {
    return img;
  }
}

(async () => {
  let previous: FreshnessReport | undefined;
  try {
    previous = JSON.parse(readFileSync(OUT, "utf-8"));
  } catch {}

  if (process.argv.includes("--trends")) {
    const { collectSnapshot } = await import("@/lib/trends/collect");
    console.log("Re-collecting Trend Intelligence snapshot…");
    const snap = await collectSnapshot({ log: () => {} });
    writeFileSync("lib/data/trendsSnapshot.json", JSON.stringify(snap, null, 2));
    console.log(`  ${snap.trends.length} trends written`);
  }

  console.log("Freshness Agent: auditing and rebuilding…");
  const r = await runFreshnessAgent(previous);
  if (!r.daily.topStory) {
    console.error("Live research returned nothing — keeping the previous snapshot.");
    process.exit(1);
  }

  mkdirSync(IMG_DIR, { recursive: true });
  if (r.daily.topStory) r.daily.topStory.image = await mirror(r.daily.topStory.image);
  for (const o of r.daily.opportunities) o.image = await mirror(o.image);
  for (const m of r.daily.brandMoves) m.image = await mirror(m.image);

  writeFileSync(OUT, JSON.stringify(r, null, 2));
  console.log(`\nDone in ${(r.durationMs / 1000).toFixed(0)}s via ${r.provider}. Edition: ${r.daily.date}`);
  for (const a of r.audit) console.log(`  [${a.status.toUpperCase().padEnd(6)}] ${a.surface.padEnd(30)} ${a.detail}`);
  console.log(`\nTop story: ${r.daily.topStory.headline} (${r.daily.topStory.publisher}, ${r.daily.topStory.age})`);
  console.log(`  image: ${r.daily.topStory.image ? `${r.daily.topStory.image.via} · ${r.daily.topStory.image.credit}` : "none"}`);
  for (const o of r.daily.opportunities) console.log(`  OPP ${o.score} ${o.brand} (${o.city}) · ${o.freshMentions} fresh mentions · img ${o.image?.via || "none"}`);
  for (const m of r.daily.brandMoves) console.log(`  MOVE ${m.kind} · ${m.brand} (${m.place}) · img ${m.image?.via || "none"}`);
  console.log(`  globe: ${Object.keys(r.globe.cities).length} cities refreshed`);
})();
