#!/usr/bin/env python3
"""
Google Custom Search agent for Innovation Scout
Free tier: 100 queries/day
Requires: GOOGLE_API_KEY + GOOGLE_CX (Custom Search Engine ID)
"""
import os
import sys
import json
import urllib.request
import urllib.parse
import logging

# Suppress all logging
logging.disable(logging.CRITICAL)

def google_search(query, num_results=10):
    """Search Google via Custom Search API"""
    api_key = os.getenv('GOOGLE_API_KEY')
    cx = os.getenv('GOOGLE_CX')
    
    if not api_key or not cx:
        print(json.dumps({
            "error": "Missing credentials",
            "message": "Set GOOGLE_API_KEY and GOOGLE_CX env vars",
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)
    
    params = {
        'key': api_key,
        'cx': cx,
        'q': query,
        'num': min(num_results, 10)  # API max 10 per request
    }
    
    url = f"https://www.googleapis.com/customsearch/v1?{urllib.parse.urlencode(params)}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        docs = []
        for item in data.get('items', []):
            docs.append({
                'title': item.get('title', ''),
                'url': item.get('link', ''),
                'snippet': item.get('snippet', ''),
                'source': 'google_search'
            })
        
        return docs
        
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        print(json.dumps({
            "error": f"Google API error {e.code}",
            "message": error_body[:200],
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": "Search failed",
            "message": str(e),
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided", "docs": []}), file=sys.stderr)
        sys.exit(1)
    
    query = sys.argv[1]
    results = google_search(query, num_results=10)
    print(json.dumps(results, ensure_ascii=False))
