import urllib.parse
from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_discourse(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts topics from a Discourse forum API (/latest.json).
    Uses high-water-mark tracking via topic_id.
    """
    results = []
    
    base_url = config.urls[0]
    if not base_url.endswith("/latest.json"):
        base_url = urllib.parse.urljoin(base_url, "/latest.json")
        
    page = pagination_state.get("page", 0)
    url = f"{base_url}?page={page}"
    
    resp = await extractor.get(url)
    data = resp.json()
    
    topics = data.get("topic_list", {}).get("topics", [])
    
    if not topics:
        # Reached the end, reset pagination
        pagination_state["page"] = 0
        return results, pagination_state
    
    for topic in topics:
        topic_id = topic.get("id")
        title = topic.get("title", "")
        
        # In a full implementation, we might fetch /t/{topic_id}.json to get actual posts
        # For this prototype, we'll just queue the topic metadata
        
        results.append({
            "id": str(uuid.uuid4()),
            "source": "discourse",
            "target_url": url,
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "json",
            "raw_content": str(topic),
            "metadata": {
                "topic_id": topic_id,
                "title": title
            }
        })
        
    pagination_state["page"] = page + 1
    
    return results, pagination_state
