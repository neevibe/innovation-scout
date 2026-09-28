// Run a full Trend Intelligence sweep and write the snapshot the page reads.
//   npm run trends            (keyless: Wikipedia, Google News, Google Trends RSS, yt-dlp)
// Set REDDIT_CLIENT_ID/SECRET, X_BEARER_TOKEN, IG_USER_ID + META_ACCESS_TOKEN,
// or YOUTUBE_API_KEY to light up more platforms.
import { writeFileSync } from "node:fs";
import { collectSnapshot } from "@/lib/trends/collect";

const OUT = "lib/data/trendsSnapshot.json";

(async () => {
  const t0 = Date.now();
  const snap = await collectSnapshot({ log: (s) => console.log(s) });
  writeFileSync(OUT, JSON.stringify(snap, null, 2));
  console.log(`\nWrote ${OUT}: ${snap.trends.length} trends, ${snap.trendingNow.length} trending-now items in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  for (const t of snap.trends.slice(0, 10)) console.log(`  ${String(t.overall).padStart(3)}  ${t.name.padEnd(28)} ${t.lifecycle.padEnd(12)} v=${t.velocityScore} BLR=${t.blrRelevance} ${t.verdict}`);
})();
