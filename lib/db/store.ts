import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type {
  StoreShape,
  Opportunity,
  Signal,
  City,
  ScoutConfig,
  OpportunityStage,
  RefreshLogEntry,
} from "@/lib/types";
import { SEED } from "@/lib/data/seed";

// ===========================================================================
// StoreDriver — the single persistence seam.
// MVP: JSON file at ./data/store.json (persists edits locally).
// Production: implement the same read()/write() against Postgres (Neon via
// Vercel Marketplace) and everything above this file is unchanged.
// ===========================================================================

// Serverless filesystems (Vercel) are read-only except the temp dir. Use it
// there so the app runs; writes persist for the instance's lifetime and the
// store re-seeds from SEED on a cold start. Locally, use ./data as before.
// Swap this whole driver for Postgres (Neon via Marketplace) for durable state.
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "scout-data") : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let cache: StoreShape | null = null;
let writeLock: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(SEED, null, 2), "utf-8");
  }
}

export async function read(): Promise<StoreShape> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(STORE_PATH, "utf-8");
  cache = JSON.parse(raw) as StoreShape;
  return cache;
}

export async function write(next: StoreShape): Promise<void> {
  // Serialise writes to avoid interleaving under concurrent requests.
  writeLock = writeLock.then(async () => {
    cache = next;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf-8");
  });
  return writeLock;
}

export async function mutate(fn: (s: StoreShape) => StoreShape | void): Promise<StoreShape> {
  const current = await read();
  // deep clone so callers can't accidentally mutate cache mid-flight
  const draft = JSON.parse(JSON.stringify(current)) as StoreShape;
  const result = fn(draft) || draft;
  await write(result);
  return result;
}

/** Force reset to seed (used by scripts/seed + a dev "reset" affordance). */
export async function resetToSeed(): Promise<StoreShape> {
  cache = null;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(SEED, null, 2), "utf-8");
  return read();
}

// --- Repositories ----------------------------------------------------------
export const Repo = {
  async config(): Promise<ScoutConfig> {
    return (await read()).config;
  },
  async setConfig(patch: Partial<ScoutConfig>): Promise<ScoutConfig> {
    const s = await mutate((d) => {
      d.config = { ...d.config, ...patch, weights: { ...d.config.weights, ...(patch.weights || {}) }, thresholds: { ...d.config.thresholds, ...(patch.thresholds || {}) } };
    });
    return s.config;
  },

  async cities(): Promise<City[]> {
    return (await read()).cities;
  },
  async setCities(cities: City[]): Promise<City[]> {
    const s = await mutate((d) => { d.cities = cities; });
    return s.cities;
  },

  async signals(): Promise<Signal[]> {
    return (await read()).signals;
  },

  async opportunities(): Promise<Opportunity[]> {
    return (await read()).opportunities;
  },
  async opportunity(id: string): Promise<Opportunity | undefined> {
    return (await read()).opportunities.find((o) => o.id === id);
  },
  async setStage(id: string, stage: OpportunityStage): Promise<Opportunity | undefined> {
    let updated: Opportunity | undefined;
    await mutate((d) => {
      const o = d.opportunities.find((x) => x.id === id);
      if (o) {
        o.stage = stage;
        o.updatedAt = new Date().toISOString();
        updated = o;
      }
    });
    return updated;
  },

  async portfolio() {
    return (await read()).bialPortfolio;
  },
  async dutyFreeSkus() {
    return (await read()).dutyFreeSkus;
  },
  async refreshLog(): Promise<RefreshLogEntry[]> {
    return (await read()).refreshLog;
  },
  async addRefreshLog(entry: RefreshLogEntry): Promise<void> {
    await mutate((d) => {
      d.refreshLog.unshift(entry);
      d.refreshLog = d.refreshLog.slice(0, 50);
      d.config.lastRefreshAt = entry.at;
    });
  },
};
