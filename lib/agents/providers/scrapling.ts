import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Scrapling (https://github.com/d4vinci/Scrapling) — keyless.
// Shells out to a local Python venv running Scrapling's Fetcher against
// DuckDuckGo Lite. LOCAL DEV ONLY: this spawns a Python process from a venv
// at ~/venvs/scrapling, which only exists on this machine — it will fail
// (cleanly, as a real provider failure) on Vercel's serverless runtime,
// which has no Python interpreter or installed venvs. Do not enable this
// provider in production until it's wrapped behind a real HTTP microservice.
// ---------------------------------------------------------------------------

const VENV_PYTHON = path.join(os.homedir(), "venvs/scrapling/bin/python");
const SCRIPT = path.join(process.cwd(), "scripts/agents/scrapling_search.py");

interface ScraplingResult {
  results?: { title: string; url: string; snippet: string }[];
  error?: string;
}

export const scraplingProvider: SearchProvider = {
  id: "scrapling",
  label: "Scrapling (DuckDuckGo)",
  keyless: true,
  complianceNote:
    "d4vinci/Scrapling — adaptive scraping framework, keyless DuckDuckGo Lite fetch. Local dev only (spawns a Python venv on this machine; unavailable on Vercel serverless).",

  async search(query, { city, country }) {
    if (process.env.VERCEL) {
      // Explicit, honest failure rather than pretending this works in prod.
      throw new Error("scrapling provider requires a local Python venv — not available on Vercel serverless");
    }
    try {
      const { stdout } = await execFileAsync(VENV_PYTHON, [SCRIPT, `${city} ${query}`], {
        timeout: 25_000,
        maxBuffer: 4 * 1024 * 1024,
      });
      const data = JSON.parse(stdout.trim()) as ScraplingResult;
      if (data.error) throw new Error(`scrapling: ${data.error}`);
      return (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        source: domainOf(r.url),
        snippet: r.snippet.slice(0, 400),
        query,
        city,
        country,
      }));
    } catch (err) {
      throw new Error(`scrapling provider failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
};
