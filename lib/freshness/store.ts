import snapshot from "@/lib/data/freshness.json";
import { runFreshnessAgent, audit, type FreshnessReport } from "./agent";

// Serverless instances share nothing and the filesystem is read-only, so the
// report lives in instance memory and the CDN caches the API responses
// (s-maxage below). The committed snapshot (written by `npm run freshness`)
// is the floor: it is served whenever live research is unavailable.

const SNAPSHOT = snapshot as unknown as FreshnessReport;
const MAX_AGE_MS = 12 * 3600 * 1000;

let current: FreshnessReport = SNAPSHOT;
let inflight: Promise<FreshnessReport> | null = null;

const ageMs = (r: FreshnessReport) => Date.now() - new Date(r.ranAt).getTime();

export async function getReport(opts: { force?: boolean } = {}): Promise<FreshnessReport> {
  if (!opts.force && ageMs(current) < MAX_AGE_MS) return current;
  if (!inflight) {
    inflight = runFreshnessAgent({ daily: current.daily, globe: current.globe })
      .then((r) => {
        // Never replace a good edition with an empty one.
        if (r.daily.topStory) current = r;
        return current;
      })
      .catch(() => ({ ...current, audit: audit(current) }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export const CDN_HEADERS = { "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" };
