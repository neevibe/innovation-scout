# 🛰️ BIAL AI Innovation Scout

A **commercial-intelligence SaaS** for Bangalore International Airport (BIAL). It doesn't just aggregate news — it runs a full pipeline:

> **Discover → Validate → Score → Recommend → Identify Decision-Maker → Enable BIAL to Act**

Every recommendation answers: *what changed in the market, why it matters, what BIAL should do, how attractive it is, and who to approach* — with a clickable evidence trail.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Runs **fully offline** (no API keys). The store is seeded with **real, grounded intelligence** researched from trade sources (Moodie Davitt, D2C Insider, World Coffee Portal, GlobeNewswire travel-retail reports, Hospitality Biz India) — every evidence link is a real published source.

Reset the store to seed anytime:

```bash
npm run seed
```

---

## What's implemented (MVP)

| Spec area | Status |
|---|---|
| Source ingestion + collection layer | ✅ `lib/agents/collector.ts` (offline collector; live web/LLM seam) |
| Signal extraction + **duplicate consolidation** | ✅ `consolidate()` merges multi-source stories into one event |
| Brand/category classification + trend detection | ✅ `classifySignal()` |
| BIAL relevance + **gap analysis** vs portfolio | ✅ `gapAgent()` + Duty Free POC |
| **Configurable opportunity scoring (9 factors, 0–100)** | ✅ `lib/scoring/engine.ts` (admin-editable weights) |
| AI recommendation (Why now / Gap / Rec / Next action) | ✅ Opportunity detail |
| **Evidence traceability** ("Why are we saying this?") | ✅ Tiered, role-tagged, clickable |
| **Public contact intelligence** (Verified vs AI-Inferred) | ✅ PII-safe, role/company channels |
| Opportunity **pipeline** (11 stages, persisted) | ✅ Board + stage control |
| Executive dashboard / trends / city / **2×2 matrix** / brief | ✅ |
| Admin config (weights, thresholds, cities, mode) | ✅ |
| Manual + automated refresh | ✅ `/api/refresh` + `vercel.json` cron |
| Anti-hallucination (`INSUFFICIENT EVIDENCE`) | ✅ enforced on every opportunity |

## The 10 agents (`lib/agents/`)

Scout · Research · Trend · Competitive Intelligence · Gap Analysis · Opportunity · Scoring · Contact Intelligence · Recommendation · Executive Briefing — composed by `runPipeline()` rather than one monolithic prompt.

---

## Live real-time collection (implemented ✅)

Set `SCOUT_MODE=live` and a refresh runs **real web collection** across every active pilot city × search lens, deduped by URL, then structured into signals.

**Providers** (`lib/agents/providers/`, selected via `SCOUT_SEARCH_PROVIDER`):
| Provider | Key | Use |
|---|---|---|
| `tavily` | `TAVILY_API_KEY` | Licensed programmatic search — **recommended for production** |
| `gdelt` | none | Keyless, programmatic-friendly (host may be network-restricted) |
| `googlenews` | none | Keyless **dev/demo default** — RSS ToS restricts non-feed-reader use |

Default selection: Tavily if its key is set, else Google News (so live mode works with **zero keys**). The collector runs a **provider fallback chain** with polite spacing + retry.

**Extraction** (`lib/agents/extract.ts`):
- With `AI_GATEWAY_API_KEY` → LLM extractor (AI SDK v5 `generateObject`, zod schema, plain `provider/model` string via Vercel AI Gateway) — names brands/companies, grounded on retrieved text only.
- Without it → deterministic heuristic extractor (classifies vertical + signal type + source tier; lower, flagged confidence).

Verified working keyless: a live refresh pulled **25 real current signals** across the 6 cities in ~7s (Dubai Duty Free record sales, new UAE malls, a Hyderabad Juicy Couture opening, etc.). Add the AI Gateway key for brand-level precision. Everything downstream (dedup, scoring, evidence, UI) is unchanged.

```bash
SCOUT_MODE=live npm run dev        # keyless (Google News)
SCOUT_MODE=live TAVILY_API_KEY=... SCOUT_SEARCH_PROVIDER=tavily AI_GATEWAY_API_KEY=... npm run dev   # production-grade
```

## Production hardening (next)

- **Database:** swap the JSON `StoreDriver` (`lib/db/store.ts`) for Postgres (Neon via Vercel Marketplace) — same `read()/write()` seam.
- **Auth/RBAC:** wire Clerk (Vercel Marketplace); the role switcher in the top bar is the UI placeholder.
- **Scraping layer:** rate-limit, robots.txt/ToS compliance, change detection, logging (spec §21–22).

---

## Architecture

```
app/            executive UI (dashboard, trends, cities, matrix, pipeline, dutyfree, brief, admin)
  api/          refresh · pipeline · config · cities
components/     Sidebar, Topbar, OpportunityCard, ScoreBadge, StageControl
lib/
  types.ts      domain model (external intel kept separate from BIAL internal data)
  scoring/      configurable weighted engine + matrix axes
  agents/       10-agent orchestration + collector seam (offline/live)
  db/           file-backed store + repositories (swap for Postgres)
  data/seed.ts  grounded real-world seed intelligence
```

External intelligence and BIAL internal data are structurally separated by design.
