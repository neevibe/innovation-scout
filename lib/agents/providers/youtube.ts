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
  publishedAt?: string;
  duration?: string;
  views?: number;
  likes?: number;
  description?: string;
}

const fmtViews = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const youtubeProvider: SearchProvider = {
  id: "youtube",
  label: "YouTube transcripts",
  keyless: true,
  // Data API search costs 100 of the free 10,000 daily quota units.
  maxLenses: 2,
  complianceNote: "YouTube Data API (official) when YOUTUBE_API_KEY set; otherwise public search (lower fidelity, captioned-videos only).",

  async search(query, opts) {
    const hits = await searchVideos(query);
    if (hits.length === 0) return [];
    const out: RawDoc[] = [];
    for (const h of hits.slice(0, 3)) {
      // Transcript scraping is slow (one page fetch per video); with the Data
      // API the description is enough and keeps the live feed fast.
      const transcript = h.description !== undefined ? h.description || null : await fetchTranscript(h.id);
      const titleVal = h.title ?? "YouTube video";
      out.push({
        // Views lead the title: signal titles are truncated at 120 chars.
        title: `${h.views != null ? `▶ ${fmtViews(h.views)} views · ` : ""}${titleVal} — ${h.channel ?? ""}`,
        url: `https://www.youtube.com/watch?v=${h.id}`,
        source: "youtube.com",
        // Keyless search gives no upload date — leave it unset rather than
        // pretending the video is brand new.
        publishedAt: h.publishedAt,
        snippet: (transcript ? transcript.slice(0, 240) : titleVal) + (h.views != null ? ` · ${fmtViews(h.views)} views · ${fmtViews(h.likes ?? 0)} likes` : ""),
        content: transcript ?? undefined,
        query,
        city: opts.city,
        country: opts.country,
      });
      if (h.description === undefined) await sleep(150);
    }
    if (out.length === 0) return [];
    for (const d of out) if (!d.source || d.source === "unknown") d.source = domainOf(d.url) || "youtube.com";
    return out;
  },
};

async function searchVideos(query: string): Promise<YtSearchHit[]> {
  if (process.env.YOUTUBE_API_KEY) {
    // Last 30 days, most-viewed first: what is actually getting watched.
    const after = new Date(Date.now() - 30 * 86400000).toISOString();
    const q = query.replace(/\s+OR\s+/gi, "|");
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&order=viewCount&publishedAfter=${after}&relevanceLanguage=en&maxResults=8&key=${process.env.YOUTUBE_API_KEY}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const j = (await res.json()) as {
        items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string; description?: string } }[];
      };
      const hits: YtSearchHit[] = (j.items || []).map((it) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        publishedAt: it.snippet.publishedAt,
        description: it.snippet.description || "",
      }));
      // View/like counts (1 quota unit for up to 50 ids).
      if (hits.length) {
        const st = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${hits.map((h) => h.id).join(",")}&key=${process.env.YOUTUBE_API_KEY}`, { cache: "no-store" });
        if (st.ok) {
          const sj = (await st.json()) as { items?: { id: string; statistics: { viewCount?: string; likeCount?: string } }[] };
          for (const it of sj.items || []) {
            const h = hits.find((x) => x.id === it.id);
            if (h) { h.views = Number(it.statistics.viewCount || 0); h.likes = Number(it.statistics.likeCount || 0); }
          }
        }
      }
      return hits.sort((a, b) => (b.views || 0) - (a.views || 0));
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
