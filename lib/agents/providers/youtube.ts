import type { RawDoc, SearchProvider } from "./types";
import { domainOf } from "./types";

// ---------------------------------------------------------------------------
// YouTube transcripts via youtube-transcript-api (keyless).
// Two phases: (1) YouTube Data API when YOUTUBE_API_KEY is set; otherwise a
// keyless HTML-scrape of /results that pulls video IDs out of the embedded
// JSON. (2) transcript fetch via the Hermes youtube-content skill helper.
// ---------------------------------------------------------------------------

interface YtSearchHit {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  duration?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const youtubeProvider: SearchProvider = {
  id: "youtube",
  label: "YouTube transcripts",
  keyless: true,
  complianceNote: "YouTube Data API (official) when YOUTUBE_API_KEY set; otherwise public search (lower fidelity, captioned-videos only).",

  async search(query, opts) {
    const hits = await searchVideos(query);
    if (hits.length === 0) return [];
    const out: RawDoc[] = [];
    for (const h of hits.slice(0, 3)) {
      const transcript = await fetchTranscript(h.id);
      const titleVal = h.title ?? "YouTube video";
      out.push({
        title: `${titleVal} — ${h.channel ?? ""}`,
        url: `https://www.youtube.com/watch?v=${h.id}`,
        source: "youtube.com",
        publishedAt: h.publishedAt ?? new Date().toISOString(),
        snippet: transcript ? transcript.slice(0, 240) : titleVal,
        content: transcript ?? undefined,
        query,
        city: opts.city,
        country: opts.country,
      });
      await sleep(150);
    }
    if (out.length === 0) return [];
    for (const d of out) if (!d.source || d.source === "unknown") d.source = domainOf(d.url) || "youtube.com";
    return out;
  },
};

async function searchVideos(query: string): Promise<YtSearchHit[]> {
  if (process.env.YOUTUBE_API_KEY) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=date&maxResults=8&key=${process.env.YOUTUBE_API_KEY}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const j = (await res.json()) as {
        items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string } }[];
      };
      return (j.items || []).map((it) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        publishedAt: it.snippet.publishedAt,
      }));
    } catch {
      return [];
    }
  }

  // Keyless fallback: HTML scrape of /results.
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const ids = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map((m) => m[1]).slice(0, 6);
    const titles = Array.from(html.matchAll(/"title":\{"runs":\[\{"text":"([^"]{1,200})"/g)).map((m) => m[1]);
    return ids.map((id, i) => ({
      id,
      title: titles[i] ?? "",
      channel: "YouTube",
      publishedAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const { spawnSync } = await import("node:child_process");
    const skillScript = "/Users/neerajprakash/.hermes/skills/media/youtube-content/scripts/fetch_transcript.py";
    const r = spawnSync("uv", ["run", "python", skillScript, `https://youtube.com/watch?v=${videoId}`, "--text-only"], {
      encoding: "utf-8",
      timeout: 15000,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    if (r.status !== 0) return null;
    const txt = (r.stdout || "").trim();
    return txt.length > 0 ? txt : null;
  } catch {
    return null;
  }
}
