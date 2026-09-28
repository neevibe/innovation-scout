import type { GeoId, Lifecycle, PlatformId, PlatformReading, TrendRecord, Verdict } from "./types";

// ---------------------------------------------------------------------------
// Trend scoring. Everything is cohort-relative: a trend's intensity on a
// platform is where it sits among all tracked trends (log-scaled), so
// numbers from very different platforms become comparable.
//
//   intensity_p  = 10 + 90 · (ln(1+x) − min) / (max − min)          per platform
//   vScore_p     = 50 + 50 · tanh(1.1 · ln(v_p / median_v_p))       50 = flat
//   momentum     = Σ w_p · intensity_p / Σ w_p                      measured p only
//   velocity     = Σ w_p · vScore_p / Σ w_p
//   breadth      = share of measured platforms with intensity ≥ 45
//   overall      = 0.5·momentum + 0.3·velocity + 0.2·100·breadth
//   BLR relevance= 0.45·fit + 0.20·India/BLR geo + 0.20·overall + 0.15·velocity
// ---------------------------------------------------------------------------

export const PLATFORM_WEIGHTS: Record<PlatformId, number> = {
  search: 0.3,
  youtube: 0.2,
  news: 0.2,
  instagram: 0.1,
  x: 0.08,
  reddit: 0.07,
  facebook: 0.05,
};

// Search velocity is an absolute ratio (same article, same audience over time),
// so it is not re-centred on the cohort median.
const ABSOLUTE_VELOCITY: PlatformId[] = ["search"];

export function logNormalise(values: (number | null)[]): (number | null)[] {
  const logs = values.map((v) => (v == null ? null : Math.log1p(Math.max(0, v))));
  const present = logs.filter((v): v is number => v != null);
  if (!present.length) return values.map(() => null);
  const min = Math.min(...present);
  const max = Math.max(...present);
  return logs.map((l) => (l == null ? null : max === min ? 55 : Math.round(10 + (90 * (l - min)) / (max - min))));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 1;
};

export const vScore = (ratio: number) => Math.round(50 + 50 * Math.tanh(1.1 * Math.log(Math.max(ratio, 0.01))));

export function lifecycleOf(momentum: number, velocity: number, series: number[]): Lifecycle {
  if (velocity >= 62) return momentum < 45 ? "Emerging" : "Accelerating";
  if (velocity >= 42) {
    // Flat velocity: call it Peak only if the search series topped out recently.
    // Smooth first (7-day mean) so a single-day Wikipedia spike can't set the "high".
    if (series.length >= 30 && velocity < 56) {
      const sm = series.map((_, i) => { const w = series.slice(Math.max(0, i - 6), i + 1); return w.reduce((a, b) => a + b, 0) / w.length; });
      const max = Math.max(...sm.slice(6));
      const recentMax = Math.max(...sm.slice(-21));
      if (recentMax < 0.6 * max) return "Cooling";
    }
    return "Peak";
  }
  return velocity >= 30 ? "Cooling" : "Declining";
}

export function verdictOf(rel: number, life: Lifecycle): Verdict {
  const live = life === "Emerging" || life === "Accelerating" || life === "Peak";
  if (rel >= 72 && live) return "Act now";
  if (rel >= 60 && life !== "Declining") return "Pilot";
  if (rel >= 46) return "Watch";
  return "Low relevance";
}

type Draft = Omit<TrendRecord, "momentum" | "velocityScore" | "breadth" | "overall" | "lifecycle" | "spread" | "dominantPlatform" | "blrRelevance" | "verdict"> & {
  rawIntensity: Partial<Record<PlatformId, number | null>>;
  rawVelocity: Partial<Record<PlatformId, number | null>>;
};

export function scoreCohort(drafts: Draft[]): TrendRecord[] {
  const platforms = Object.keys(PLATFORM_WEIGHTS) as PlatformId[];

  // 1) Cohort-normalise intensity and velocity per platform.
  for (const p of platforms) {
    const norm = logNormalise(drafts.map((d) => d.rawIntensity[p] ?? null));
    const vs = drafts.map((d) => d.rawVelocity[p]).filter((v): v is number => v != null && isFinite(v) && v > 0);
    const med = ABSOLUTE_VELOCITY.includes(p) ? 1 : median(vs) || 1;
    drafts.forEach((d, i) => {
      const v = d.rawVelocity[p];
      d.platforms[p] = {
        ...d.platforms[p],
        intensity: norm[i],
        velocity: v != null && isFinite(v) && v > 0 ? +(v / med).toFixed(2) : null,
      };
    });
  }

  // 2) Geo — normalise each geography column across the cohort.
  const geos: GeoId[] = ["global", "asia", "india", "bengaluru"];
  for (const g of geos) {
    const norm = logNormalise(drafts.map((d) => d.geoRaw[g]));
    drafts.forEach((d, i) => (d.geo[g] = norm[i]));
  }

  // 3) Composite scores.
  return drafts.map((d) => {
    const measured = platforms.filter((p) => d.platforms[p].intensity != null);
    const wsum = measured.reduce((s, p) => s + PLATFORM_WEIGHTS[p], 0) || 1;
    const momentum = Math.round(measured.reduce((s, p) => s + PLATFORM_WEIGHTS[p] * (d.platforms[p].intensity as number), 0) / wsum);
    const withV = measured.filter((p) => d.platforms[p].velocity != null);
    const vw = withV.reduce((s, p) => s + PLATFORM_WEIGHTS[p], 0) || 1;
    const velocityScore = withV.length ? Math.round(withV.reduce((s, p) => s + PLATFORM_WEIGHTS[p] * vScore(d.platforms[p].velocity as number), 0) / vw) : 50;
    const strong = measured.filter((p) => (d.platforms[p].intensity as number) >= 45);
    const breadth = measured.length ? strong.length / measured.length : 0;
    const overall = Math.round(0.5 * momentum + 0.3 * velocityScore + 0.2 * 100 * breadth);

    const sorted = [...measured].sort((a, b) => (d.platforms[b].intensity as number) - (d.platforms[a].intensity as number));
    const top = sorted[0] ?? null;
    const gap = sorted.length > 1 ? (d.platforms[sorted[0]].intensity as number) - (d.platforms[sorted[1]].intensity as number) : 0;
    const over50 = measured.filter((p) => (d.platforms[p].intensity as number) >= 50).length;
    const spread = over50 >= 3 ? "cross-platform" : over50 <= 1 && gap >= 20 ? "platform-specific" : "mixed";

    const lifecycle = lifecycleOf(momentum, velocityScore, d.series);
    const home = [d.geo.india, d.geo.bengaluru].filter((x): x is number => x != null);
    const homeGeo = home.length ? home.reduce((a, b) => a + b, 0) / home.length : 40;
    const blrRelevance = Math.round(0.45 * d.blr.fit + 0.2 * homeGeo + 0.2 * overall + 0.15 * velocityScore);
    const { rawIntensity: _ri, rawVelocity: _rv, ...rest } = d;
    return {
      ...rest,
      momentum,
      velocityScore,
      breadth: +breadth.toFixed(2),
      overall,
      lifecycle,
      spread,
      dominantPlatform: top,
      blrRelevance,
      verdict: verdictOf(blrRelevance, lifecycle),
    } as TrendRecord;
  });
}

export const emptyReading = (): PlatformReading => ({ intensity: null, velocity: null });
export type { Draft };
