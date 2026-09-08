import type { RawDoc, SearchProvider } from "./types";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// ScrapeGraphAI (https://github.com/ScrapeGraphAI/Scrapegraph-ai) — LLM-driven.
// Shells out to a local Python venv running a Google-News-RSS + local Ollama
// (qwen2.5:1.5b, keyless, free) extraction pass — no OpenAI key required.
// LOCAL DEV ONLY: unavailable on Vercel serverless (no Python venv there).
// ---------------------------------------------------------------------------

const VENV_PYTHON = path.join(os.homedir(), "venvs/scrapegraphai/bin/python");
const SCRIPT = path.join(process.cwd(), "scripts/agents/scrapegraphai_search.py");

interface ScrapeGraphResult {
  results?: unknown[];
  error?: string;
}

export const scrapegraphaiProvider: SearchProvider = {
  id: "scrapegraphai",
  label: "ScrapeGraphAI (LLM Search)",
  keyless: true,
  // Each call runs a real local-LLM (Ollama qwen2.5:1.5b) inference pass —
  // 50-150s per query. Capped to 1 lens/city (6 queries total) so a refresh
  // stays bounded; the other providers cover the remaining 5 lenses.
  maxLenses: 1,
  complianceNote:
    "ScrapeGraphAI/Scrapegraph-ai (MIT) — LLM-driven graph scraper, wired to local Ollama qwen2.5:1.5b (free, keyless) over Bing search HTML. Capped to 1 query/city per refresh (local LLM inference is slow). Local dev only.",

  async search(query, { city, country }) {
    if (process.env.VERCEL) {
      throw new Error("scrapegraphai provider requires a local Python venv — not available on Vercel serverless");
    }
    try {
      const { stdout } = await execFileAsync(
        VENV_PYTHON,
        [SCRIPT, `${city} ${query}`],
        { timeout: 170_000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env } },
      );
      const data = JSON.parse(stdout.trim()) as ScrapeGraphResult;
      if (data.error) throw new Error(`scrapegraphai: ${data.error}`);
      // Best-effort normalization — SearchGraph's output shape varies by prompt.
      const items = Array.isArray(data.results) ? data.results : [];
      const docs: RawDoc[] = [];
      for (const item of items) {
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const url = typeof o.url === "string" ? o.url : typeof o.source === "string" ? o.source : "";
          if (!url) continue;
          docs.push({
            title: typeof o.title === "string" ? o.title : query,
            url,
            source: "scrapegraphai",
            snippet: typeof o.content === "string" ? o.content.slice(0, 400) : JSON.stringify(o).slice(0, 400),
            query,
            city,
            country,
          });
        }
      }
      return docs;
    } catch (err) {
      throw new Error(`scrapegraphai provider failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
};
