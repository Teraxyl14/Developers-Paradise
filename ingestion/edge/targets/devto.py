from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_devto(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    page = pagination_state.get("page", 1)
    
    tag = config.urls[0] if config.urls else ""
    url = f"https://dev.to/api/articles?page={page}&per_page=30"
    if tag:
        url += f"&tag={tag}"
    
    resp = await extractor.get(url)
    data = resp.json()
    
    if not data:
        pagination_state["page"] = 1
        return results, pagination_state
        
    for item in data:
        title = item.get("title", "")
        description = item.get("description", "")
        
        results.append({
            "id": str(uuid.uuid4()),
            "source": "devto",
            "target_url": item.get("url", url),
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "text",
            "raw_content": f"Title: {title}\n\n{description}",
            "metadata": {
                "author": item.get("user", {}).get("username", ""),
                "tags": item.get("tag_list", [])
            }
        })
        
    pagination_state["page"] = page + 1
    return results, pagination_state
