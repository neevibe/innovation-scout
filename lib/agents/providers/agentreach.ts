import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Agent Reach (https://github.com/Panniantong/Agent-Reach) — keyless.
// Shells out to a local Python venv using agent-reach's bundled feedparser
// to pull real entries from travel-retail/duty-free trade press RSS feeds.
// LOCAL DEV ONLY: this spawns a Python process from a venv at
// ~/venvs/agent-reach, which only exists on this machine — it will fail
// (cleanly, as a real provider failure) on Vercel's serverless runtime.
// ---------------------------------------------------------------------------

const VENV_PYTHON = path.join(os.homedir(), "venvs/agent-reach/bin/python");
const SCRIPT = path.join(process.cwd(), "scripts/agents/agent_reach_search.py");

interface AgentReachResult {
  results?: { title: string; url: string; snippet: string; publishedAt?: string; source?: string }[];
  error?: string;
  feedErrors?: string[];
}

export const agentReachProvider: SearchProvider = {
  id: "agentreach",
  label: "Agent Reach (Trade Press RSS)",
  keyless: true,
  complianceNote:
    "Panniantong/Agent-Reach — RSS channel over travel-retail trade press (Moodie Davitt, DFNI, TRBusiness, Retail Dive). Local dev only.",

  async search(query, { city, country }) {
    if (process.env.VERCEL) {
      throw new Error("agentreach provider requires a local Python venv — not available on Vercel serverless");
    }
    try {
      const { stdout } = await execFileAsync(VENV_PYTHON, [SCRIPT, `${city} ${query}`], {
        timeout: 25_000,
        maxBuffer: 4 * 1024 * 1024,
      });
      const data = JSON.parse(stdout.trim()) as AgentReachResult;
      if (data.error) throw new Error(`agentreach: ${data.error}`);
      return (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        source: r.source ? domainOf(r.source) : domainOf(r.url),
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : undefined,
        snippet: r.snippet.slice(0, 400),
        query,
        city,
        country,
      }));
    } catch (err) {
      throw new Error(`agentreach provider failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
};
