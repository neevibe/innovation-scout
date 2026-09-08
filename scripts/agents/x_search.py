#!/usr/bin/env python3
"""
X/Twitter search agent for Innovation Scout
Uses xurl CLI (official X API tool)
Requires: xurl auth configured with valid credentials
"""
import os
import sys
import json
import subprocess
import logging

# Suppress all logging
logging.disable(logging.CRITICAL)

def x_search(query, num_results=20):
    """Search X/Twitter via xurl CLI"""
    
    # Check if xurl is available and authenticated
    try:
        result = subprocess.run(
            ['xurl', 'auth', 'status'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if 'No apps registered' in result.stdout:
            print(json.dumps({
                "error": "X auth not configured",
                "message": "Run: xurl auth apps add + xurl auth oauth2",
                "docs": []
            }), file=sys.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print(json.dumps({
            "error": "xurl not installed",
            "message": "Install xurl CLI first",
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": "Auth check failed",
            "message": str(e),
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)
    
    # Run the search
    try:
        result = subprocess.run(
            ['xurl', 'search', query, '-n', str(num_results)],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(json.dumps({
                "error": f"Search failed (exit {result.returncode})",
                "message": result.stderr[:200] if result.stderr else result.stdout[:200],
                "docs": []
            }), file=sys.stderr)
            sys.exit(1)
        
        # Parse xurl JSON output
        data = json.loads(result.stdout)
        
        docs = []
        posts = data.get('data', [])
        if not isinstance(posts, list):
            posts = [data.get('data', {})]
        
        for post in posts:
            if not post:
                continue
                
            post_id = post.get('id', '')
            author_id = post.get('author_id', '')
            text = post.get('text', '')
            created_at = post.get('created_at', '')
            
            # Build X URL
            url = f"https://x.com/i/status/{post_id}" if post_id else ''
            
            docs.append({
                'title': text[:100] + ('...' if len(text) > 100 else ''),
                'url': url,
                'snippet': text,
                'source': 'x_twitter',
                'created_at': created_at,
                'author_id': author_id
            })
        
        return docs
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": "Invalid JSON from xurl",
            "message": str(e),
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": "Search execution failed",
            "message": str(e),
            "docs": []
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided", "docs": []}), file=sys.stderr)
        sys.exit(1)
    
    query = sys.argv[1]
    results = x_search(query, num_results=20)
    print(json.dumps(results, ensure_ascii=False))
