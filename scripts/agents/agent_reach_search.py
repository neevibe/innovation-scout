#!/usr/bin/env python3
"""
Agent Reach-backed search agent for Innovation Scout.
Uses agent_reach's bundled feedparser (RSS channel: agent_reach.channels.rss)
to pull real entries from travel-retail / duty-free trade press feeds, then
filters by the query's keywords. No fabricated data: on any failure this
prints {"error": "..."} and exits non-zero.

Usage: agent_reach_search.py "<query>"
"""
import sys
import json
import re

FEEDS = [
    "https://www.moodiedavittreport.com/feed/",
    "https://www.dfnionline.com/feed/",
    "https://www.trbusiness.com/feed/",
    "https://www.retaildive.com/feeds/news/",
]


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no query provided"}))
        sys.exit(1)
    query = sys.argv[1]

    try:
        import feedparser  # bundled with agent-reach's yt-dlp/rss deps
    except Exception as e:
        print(json.dumps({"error": f"feedparser not importable: {e}"}))
        sys.exit(1)

    # Verify agent_reach itself is actually installed (this script is meant
    # to run inside its venv) rather than silently falling back.
    try:
        import agent_reach  # noqa: F401
    except Exception as e:
        print(json.dumps({"error": f"agent_reach not importable: {e}"}))
        sys.exit(1)

    keywords = [w.lower() for w in re.findall(r"[a-zA-Z]{3,}", query) if w.lower() not in {
        "the", "and", "for", "new", "with", "from", "brand", "opening", "expansion",
        "concept", "launch", "product", "service", "pop", "activation",
    }]

    results = []
    errors = []
    for feed_url in FEEDS:
        try:
            d = feedparser.parse(feed_url, request_headers={"User-Agent": "Mozilla/5.0"})
            if d.get("bozo") and not d.entries:
                errors.append(f"{feed_url}: {d.get('bozo_exception')}")
                continue
            for e in d.entries:
                title = e.get("title", "")
                summary = e.get("summary", "") or e.get("description", "")
                haystack = (title + " " + summary).lower()
                if not keywords or any(kw in haystack for kw in keywords):
                    results.append({
                        "title": title,
                        "url": e.get("link", ""),
                        "snippet": re.sub(r"<[^>]+>", " ", summary).strip()[:280],
                        "publishedAt": e.get("published", ""),
                        "source": feed_url,
                    })
        except Exception as e:
            errors.append(f"{feed_url}: {e}")

    if not results and errors and len(errors) == len(FEEDS):
        print(json.dumps({"error": "all feeds failed: " + "; ".join(errors)}))
        sys.exit(1)

    print(json.dumps({"results": results[:15], "feedErrors": errors}))


if __name__ == "__main__":
    main()
