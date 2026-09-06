// One-shot Postgres migration: creates the schema and seeds it from ./lib/data/seed.ts.
// Re-runnable: idempotent (CREATE TABLE IF NOT EXISTS + ON CONFLICT).
//
//   tsx scripts/migrate.ts                     # migrate against DATABASE_URL
//   tsx scripts/migrate.ts --reset             # wipe and re-seed from SEED
//
// After running this once, your app reads/writes through Postgres whenever
// DATABASE_URL is set. Without DATABASE_URL it falls back to the JSON store
// (preserving offline / demo behaviour).

import { Pool } from "pg";
import { SEED } from "../lib/data/seed";

const reset = process.argv.includes("--reset");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS scout_store (
  id         INTEGER PRIMARY KEY,
  data       JSONB NOT NULL,
  version    BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(2);
  }
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    await pool.query(SCHEMA);
    if (reset) {
      await pool.query("DELETE FROM scout_store");
      console.log("[migrate] cleared scout_store");
    }
    await pool.query(
      `INSERT INTO scout_store (id, data, version)
       VALUES (1, $1::jsonb, 0)
       ON CONFLICT (id) DO UPDATE
         SET data = EXCLUDED.data,
             version = scout_store.version + 1,
             updated_at = now()`,
      [JSON.stringify(SEED)],
    );
    const r = await pool.query<{ data: { opportunities?: unknown[]; signals?: unknown[]; cities?: unknown[] }; version: string }>(
      "SELECT data, version FROM scout_store WHERE id = 1",
    );
    const d = r.rows[0].data;
    console.log(
      `[migrate] ok. opportunities=${d.opportunities?.length ?? 0} ` +
        `signals=${d.signals?.length ?? 0} cities=${d.cities?.length ?? 0} version=${r.rows[0].version}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[migrate] failed:", e);
  process.exit(1);
});
