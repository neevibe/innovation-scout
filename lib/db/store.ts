import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { Pool } from "pg";
import type {
  StoreShape,
  Opportunity,
  Signal,
  City,
  ScoutConfig,
  OpportunityStage,
  RefreshLogEntry,
  MarketCandidate,
  BialPortfolioEntry,
  DutyFreeSku,
  AgentRunEntry,
} from "@/lib/types";
import { SEED } from "@/lib/data/seed";

// ===========================================================================
// StoreDriver — single persistence seam.
// MVP / local: JSON file at ./data/store.json (auto-selected when DATABASE_URL
//                is absent — keeps the offline demo one-command-runnable).
// Production: Postgres (Neon via Vercel Marketplace OR local Docker) when
//             DATABASE_URL is set. Same read()/write()/mutate()/Repo contract,
//             every consumer above this file is unchanged.
// ===========================================================================

// --- Driver selection ------------------------------------------------------
const USE_DB = !!process.env.DATABASE_URL;

// --- File-backed driver (preserved behaviour for offline / local-dev) ------
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "scout-data") : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let fileCache: StoreShape | null = null;
let writeLock: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(SEED, null, 2), "utf-8");
  }
}

async function fileRead(): Promise<StoreShape> {
  // Always re-read from disk in dev (force-dynamic pages need fresh data).
  // In production (Vercel serverless), each invocation gets a fresh process anyway.
  await ensureFile();
  const raw = await fs.readFile(STORE_PATH, "utf-8");
  fileCache = JSON.parse(raw) as StoreShape;
  return fileCache;
}

async function fileWrite(next: StoreShape): Promise<void> {
  writeLock = writeLock.then(async () => {
    fileCache = next;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf-8");
  });
  return writeLock;
}

async function fileResetToSeed(): Promise<StoreShape> {
  fileCache = null;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(SEED, null, 2), "utf-8");
  return fileRead();
}

// --- Postgres driver -------------------------------------------------------
// One row, one JSONB column, optimistic version. The whole StoreShape stays in
// Postgres-native JSONB, so the domain model in lib/types.ts stays the contract
// and we can swap to normalised tables later without changing call sites.
type StoreRow = { data: StoreShape; version: number };

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon serverless connections close fast; tolerate quick reconnects.
      max: 5,
      idleTimeoutMillis: 10_000,
    });
    pool.on("error", (err) => {
      console.error("[scout] pg pool error:", err);
    });
  }
  return pool;
}

const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS scout_store (
  id         INTEGER PRIMARY KEY,
  data       JSONB NOT NULL,
  version    BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const SCHEMA_SEED = `
INSERT INTO scout_store (id, data, version)
VALUES (1, $1::jsonb, 0)
ON CONFLICT (id) DO NOTHING;
`;

let schemaReady: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const seedJson = JSON.stringify(SEED);
    const p = getPool();
    // pg's prepared-statement protocol rejects multi-statement queries,
    // so run DDL and seed as separate round-trips.
    await p.query(SCHEMA_DDL);
    await p.query(SCHEMA_SEED, [seedJson]);
  })();
  return schemaReady;
}

async function dbRead(): Promise<StoreShape> {
  await ensureSchema();
  const r = await getPool().query<StoreRow>("SELECT data FROM scout_store WHERE id = 1");
  if (r.rowCount === 0) {
    // Should not happen post-ensureSchema, but recover cleanly.
    await getPool().query(
      "INSERT INTO scout_store (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
      [JSON.stringify(SEED)],
    );
    return SEED;
  }
  return r.rows[0].data as StoreShape;
}

async function dbWrite(next: StoreShape): Promise<void> {
  await ensureSchema();
  // Optimistic concurrency: bump version if unchanged, retry once on conflict.
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await getPool().query<{ version: string }>("SELECT version FROM scout_store WHERE id = 1");
    const v = Number(cur.rows[0].version);
    const upd = await getPool().query(
      "UPDATE scout_store SET data = $1::jsonb, version = $2, updated_at = now() WHERE id = 1 AND version = $3",
      [JSON.stringify(next), v + 1, v],
    );
    if ((upd.rowCount ?? 0) === 1) return;
    // race lost — re-read and retry
  }
  throw new Error("[scout] concurrent write conflict after retry");
}

async function dbResetToSeed(): Promise<StoreShape> {
  await ensureSchema();
  await getPool().query(
    "UPDATE scout_store SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1",
    [JSON.stringify(SEED)],
  );
  return dbRead();
}

// --- Public driver contract (unchanged signatures) -------------------------
export async function read(): Promise<StoreShape> {
  return USE_DB ? dbRead() : fileRead();
}

export async function write(next: StoreShape): Promise<void> {
  if (USE_DB) return dbWrite(next);
  return fileWrite(next);
}

export async function mutate(fn: (s: StoreShape) => StoreShape | void): Promise<StoreShape> {
  // Serialize mutations to keep cross-driver semantics (no interleaved writes).
  // Postgres-level isolation is already strong enough, but we serialize
  // read→mutate→write so callers don't see each other's drafts mid-flight.
  const key = USE_DB ? "__pg_mutate__" : "__file_mutate__";
  // @ts-expect-error attach a per-driver lock onto the function module
  mutate.__locks = mutate.__locks || {};
  // @ts-expect-error
  const prev: Promise<void> = mutate.__locks[key] || Promise.resolve();
  let resolve!: () => void;
  const next = new Promise<void>((r) => (resolve = r));
  // @ts-expect-error
  mutate.__locks[key] = prev.then(() => next);
  await prev;
  try {
    const current = await read();
    const draft = JSON.parse(JSON.stringify(current)) as StoreShape;
    const result = fn(draft) || draft;
    await write(result);
    return result;
  } finally {
    resolve();
  }
}

/** Force reset to seed (used by scripts/seed + a dev "reset" affordance). */
export async function resetToSeed(): Promise<StoreShape> {
  return USE_DB ? dbResetToSeed() : fileResetToSeed();
}

// --- Repositories ----------------------------------------------------------
export const Repo = {
  async config(): Promise<ScoutConfig> {
    return (await read()).config;
  },
  async setConfig(patch: Partial<ScoutConfig>): Promise<ScoutConfig> {
    const s = await mutate((d) => {
      d.config = {
        ...d.config,
        ...patch,
        weights: { ...d.config.weights, ...(patch.weights || {}) },
        thresholds: { ...d.config.thresholds, ...(patch.thresholds || {}) },
      };
    });
    return s.config;
  },

  async cities(): Promise<City[]> {
    return (await read()).cities;
  },
  async setCities(cities: City[]): Promise<City[]> {
    const s = await mutate((d) => {
      d.cities = cities;
    });
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

  async candidates(): Promise<MarketCandidate[]> {
    return (await read()).candidates || [];
  },
  async candidatesForCity(city: string) {
    return ((await read()).candidates || []).filter((c) => c.city === city).sort((a, b) => b.score - a.score);
  },
  async portfolio() {
    return (await read()).bialPortfolio;
  },
  async dutyFreeSkus(): Promise<DutyFreeSku[]> {
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

  async agentRuns(): Promise<AgentRunEntry[]> {
    return (await read()).agentRuns || [];
  },
  async addAgentRun(entry: AgentRunEntry): Promise<void> {
    await mutate((d) => {
      d.agentRuns = d.agentRuns || [];
      d.agentRuns.unshift(entry);
      d.agentRuns = d.agentRuns.slice(0, 20);
    });
  },
};
