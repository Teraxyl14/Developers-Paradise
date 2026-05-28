from typing import Any, Dict, List
import uuid
import datetime
import feedparser

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_rss_feeds(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    # RSS doesn't typically paginate the same way, we just fetch the whole feed and rely on deduplication later.
    # However, we can use an 'etag' or 'modified' state to avoid re-parsing unchanged feeds if supported.
    
    feed_url = config.urls[0]
    
    headers = {}
    if "etag" in pagination_state:
        headers["If-None-Match"] = pagination_state["etag"]
    if "modified" in pagination_state:
        headers["If-Modified-Since"] = pagination_state["modified"]
        
    resp = await extractor.get(feed_url, headers=headers)
    
    if resp.status_code == 304:
        # Not modified
        return results, pagination_state
        
    if "etag" in resp.headers:
        pagination_state["etag"] = resp.headers["etag"]
    if "last-modified" in resp.headers:
        pagination_state["modified"] = resp.headers["last-modified"]
        
    # feedparser expects a string or file-like object
    feed = feedparser.parse(resp.text)
    
    for entry in feed.entries:
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        
        results.append({
            "id": str(uuid.uuid4()),
            "source": "rss",
            "target_url": entry.get("link", feed_url),
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "html",
            "raw_content": f"Title: {title}\n\n{summary}",
            "metadata": {
                "feed_title": feed.feed.get("title", "")
            }
        })
        
    return results, pagination_state
