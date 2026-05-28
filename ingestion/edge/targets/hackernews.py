from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_hackernews(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    
    # HN uses firebase API
    # 1. Get top stories
    top_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    resp = await extractor.get(top_url)
    story_ids = resp.json()
    
    # Basic pagination logic to only process 10 at a time
    cursor = pagination_state.get("cursor", 0)
    batch = story_ids[cursor:cursor+10]
    
    if not batch:
        pagination_state["cursor"] = 0
        return results, pagination_state
        
    for sid in batch:
        item_url = f"https://hacker-news.firebaseio.com/v0/item/{sid}.json"
        item_resp = await extractor.get(item_url)
        item = item_resp.json()
        
        if item and item.get("title"):
            title = item.get("title", "")
            text = item.get("text", "")
            url = item.get("url", f"https://news.ycombinator.com/item?id={sid}")
            
            results.append({
                "id": str(uuid.uuid4()),
                "source": "hackernews",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": f"Title: {title}\n\n{text}",
                "metadata": {
                    "item_id": sid,
                    "score": item.get("score", 0)
                }
            })
            
    pagination_state["cursor"] = cursor + 10
    return results, pagination_state
