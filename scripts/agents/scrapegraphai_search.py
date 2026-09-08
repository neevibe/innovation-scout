#!/usr/bin/env python3
"""
ScrapeGraphAI agent — genuinely uses scrapegraphai.SmartScraperGraph, powered
by local Ollama (qwen2.5:1.5b, free/keyless). Fetches Bing search HTML via
urllib (independent of Scrapling's DuckDuckGo source, avoids shared rate
limits), then hands the raw HTML to SmartScraperGraph for real LLM-based
structured extraction. No fabricated data: on failure this prints
{"error": "..."} with an empty results list.
"""

import sys
import json
import re
import logging
import urllib.parse
import urllib.request

logging.disable(logging.CRITICAL)

query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Bengaluru airport duty free"
search_url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}"

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}
req = urllib.request.Request(search_url, headers=headers)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html_code = resp.read().decode("utf-8", errors="ignore")
except Exception as e:
    print(json.dumps({"error": f"fetch failed: {e}", "results": []}))
    sys.exit(0)

# Bing's real result list (<ol id="b_results">) starts well past the <head>
# boilerplate/CSS links — slicing from the top wastes the LLM's context
# window on meta tags. Find the results block and feed only that.
results_idx = html_code.find('id="b_results"')
if results_idx == -1:
    results_idx = html_code.find("b_algo")
if results_idx != -1:
    window = html_code[max(0, results_idx - 200): results_idx + 6000]
else:
    window = html_code[:6000]

# Strip inline <link>/<script>/style noise and tags to leave mostly text +
# hrefs, so the small local model can actually ground on real content.
window = re.sub(r"<link[^>]*>", "", window)
window = re.sub(r"<script[\s\S]*?</script>", "", window)
window = re.sub(r"<style[\s\S]*?</style>", "", window)
window = window[:6000]

graph_config = {
    "llm": {
        "model": "ollama/qwen2.5:1.5b",
        "temperature": 0,
        "format": "json",
        "base_url": "http://localhost:11434",
    },
    "verbose": False,
}

prompt = (
    "This is a Bing search results HTML page. Extract the 5 most relevant "
    "result titles and links related to commercial/retail/F&B/brand activity. "
    "Return JSON with a key 'items', a list of objects each with 'title' and 'url'."
)

try:
    from scrapegraphai.graphs import SmartScraperGraph

    smart_scraper = SmartScraperGraph(
        prompt=prompt,
        source=window,
        config=graph_config,
    )
    result = smart_scraper.run()

    # qwen2.5:1.5b sometimes wraps its JSON reply in ```json fences inside a
    # 'content' key (string, list-of-chunks, or already-parsed dict) instead
    # of returning parsed JSON directly — unwrap it.
    if isinstance(result, dict) and "content" in result and "items" not in result:
        raw = result["content"]
        if isinstance(raw, dict):
            result = raw
        else:
            if isinstance(raw, list):
                raw = "\n".join(str(x) for x in raw)
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", str(raw).strip(), flags=re.MULTILINE).strip()
            try:
                result = json.loads(cleaned)
            except Exception:
                pass

    items = result.get("items", []) if isinstance(result, dict) else (result if isinstance(result, list) else [])
    if not items and isinstance(result, dict):
        for v in result.values():
            if isinstance(v, list):
                items = v
                break

    docs = []
    for item in items:
        if isinstance(item, dict):
            title = item.get("title") or query
            url = item.get("url") or search_url
            # Bing wraps result URLs in bing.com/ck/a?...&u=<base64url>
            m = re.search(r"[?&]u=a1([A-Za-z0-9_-]+)", str(url))
            if m:
                try:
                    import base64
                    padded = m.group(1) + "=" * (-len(m.group(1)) % 4)
                    decoded = base64.urlsafe_b64decode(padded).decode("utf-8", errors="ignore")
                    if decoded.startswith("http"):
                        url = decoded
                except Exception:
                    pass
            docs.append({
                "title": str(title),
                "url": str(url),
                "source": "scrapegraphai",
                "snippet": f"Extracted via ScrapeGraphAI SmartScraperGraph (Ollama qwen2.5:1.5b) for '{query}': {title}",
                "query": query,
            })

    if not docs:
        raise ValueError(f"SmartScraperGraph returned no usable items: {result}")

    print(json.dumps({"results": docs}))

except Exception as e:
    print(json.dumps({"error": str(e), "results": []}))
