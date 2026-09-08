#!/usr/bin/env python3
"""
Scrapling-backed search agent for Innovation Scout.
Uses the Scrapling Fetcher (https://github.com/d4vinci/Scrapling) to run a
real, keyless DuckDuckGo Lite query and return normalized results as JSON on
stdout. No fabricated data: on any failure this prints {"error": "..."} and
exits non-zero so the Node provider surfaces it as a real failure.

Usage: scrapling_search.py "<query>"
"""
import sys
import json
import re
import logging
from urllib.parse import unquote, urlparse, parse_qs

# Scrapling logs an INFO line per fetch to stdout by default, which corrupts
# the JSON we print. Silence all logging so stdout is JSON-only.
logging.disable(logging.CRITICAL)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no query provided"}))
        sys.exit(1)
    query = sys.argv[1]

    try:
        from scrapling.fetchers import Fetcher
    except Exception as e:
        print(json.dumps({"error": f"scrapling not importable: {e}"}))
        sys.exit(1)

    try:
        page = Fetcher.get(
            f"https://lite.duckduckgo.com/lite/?q={query}",
            stealthy_headers=True,
            timeout=20,
        )
    except Exception as e:
        print(json.dumps({"error": f"fetch failed: {e}"}))
        sys.exit(1)

    if page.status != 200:
        print(json.dumps({"error": f"non-200 status: {page.status}"}))
        sys.exit(1)

    results = []
    try:
        links = page.css("a.result-link")
        snippets = page.css("td.result-snippet")
        for i, a in enumerate(links[:10]):
            href = a.attrib.get("href", "")
            # DuckDuckGo lite wraps real URLs in a redirect: extract uddg=
            real_url = href
            if "uddg=" in href:
                qs = parse_qs(urlparse(href).query)
                if "uddg" in qs:
                    real_url = unquote(qs["uddg"][0])
            elif href.startswith("//"):
                real_url = "https:" + href
            title = (a.text or "").strip()
            snippet = ""
            if i < len(snippets):
                snippet = (snippets[i].text or "").strip()
            if title and real_url.startswith("http"):
                results.append({"title": title, "url": real_url, "snippet": snippet})
    except Exception as e:
        print(json.dumps({"error": f"parse failed: {e}"}))
        sys.exit(1)

    print(json.dumps({"results": results}))

if __name__ == "__main__":
    main()
