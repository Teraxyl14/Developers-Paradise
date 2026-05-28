from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_reddit(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    after = pagination_state.get("after")
    
    subreddit = config.urls[0]
    
    url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=25"
    if after:
        url += f"&after={after}"
        
    extractor.session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DevelopersParadise/1.0"
    })
        
    resp = await extractor.get(url)
    data = resp.json()
    
    posts = data.get("data", {}).get("children", [])
    
    for post_data in posts:
        post = post_data.get("data", {})
        title = post.get("title", "")
        body = post.get("selftext", "")
        
        if title:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "reddit",
                "target_url": f"https://reddit.com{post.get('permalink')}",
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "markdown",
                "raw_content": f"Title: {title}\n\n{body}",
                "metadata": {
                    "subreddit": subreddit,
                    "author": post.get("author", ""),
                    "score": post.get("score", 0)
                }
            })
            
    pagination_state["after"] = data.get("data", {}).get("after")
    if not pagination_state["after"]:
        pagination_state["after"] = None
        
    return results, pagination_state
