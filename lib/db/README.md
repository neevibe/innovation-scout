# `lib/db/store.ts` — the persistence seam

The app reads/writes the entire store through `read()`, `write()`, `mutate()` and `Repo.*` defined here. None of the consumer code (`app/*`, `lib/agents/*`, `scripts/seed.ts`) touches the filesystem or Postgres directly — that's the single seam you swap to change storage.

## Driver selection (automatic)

| `DATABASE_URL` env var | Driver used | Notes |
|---|---|---|
| **set** (`postgres://...`) | Postgres (Postgres JSONB) | Production. Works with Neon, local Docker, Vercel Marketplace Postgres, anything that speaks the Postgres wire protocol. |
| **unset** | JSON file at `./data/store.json` | Preserves the original offline / one-command demo behaviour. Auto-seeds from `lib/data/seed.ts` on first read. |

So:
- **Clone + `npm run dev` with no setup** → still works (JSON driver).
- **Set `DATABASE_URL` + run the migration once** → uses Postgres for everything.

## Setting up Postgres

### Option A — Neon (recommended for Vercel deployments)

1. Create a Neon project (neon.tech) or use Vercel Marketplace → "Neon Postgres".
2. Copy the connection string into `.env.local` as `DATABASE_URL`.
3. From the project root: `npm run migrate`
4. Start the app: `npm run dev` (it now reads/writes through Postgres).
5. Deploy to Vercel with the same env var. Existing JSON users keep working — data starts fresh in Postgres.

### Option B — local Docker (matches prod API exactly, no cloud account)

```bash
docker run -d --name scout-pg -p 5432:5432 \
  -e POSTGRES_USER=scout -e POSTGRES_PASSWORD=scout -e POSTGRES_DB=scout \
  postgres:16

DATABASE_URL=postgresql://scout:scout@localhost:5432/scout npm run migrate
npm run dev
```

### Option C — any Postgres 14+ (Supabase, RDS, Render, Railway)

Drop the connection string into `DATABASE_URL`, run `npm run migrate`, you're done.

## Migration / seeding

```bash
tsx scripts/migrate.ts              # idempotent — creates table, seeds from SEED
tsx scripts/migrate.ts --reset      # wipe + re-seed
```

## Why one row of JSONB and not normalised tables?

- Zero call-site churn while migrating from JSON to Postgres — the domain model in `lib/types.ts` stays the contract.
- Most reads are whole-document (every page renders the whole state).
- Writes are protected by an optimistic version column so concurrent admin edits can't silently drop each other.

When the data grows or you want partial updates without optimistic retries, promote specific lists (`opportunities`, `signals`, `candidates`, `refreshLog`) into their own tables. The `Repo.*` methods are the right place to make that change — callers continue to use the same shape.

## Operational notes

- **Pool size**: 5 connections per Vercel instance. Neon can handle thousands of those.
- **Cold start on Vercel**: `ensureSchema()` runs once per cold start and is `Promise`-cached, so concurrent first-read requests share the migration work.
- **Backup**: Neon has PITR; for Docker volumes, snapshot via `docker exec scout-pg pg_dump -U scout scout > backup.sql`.
