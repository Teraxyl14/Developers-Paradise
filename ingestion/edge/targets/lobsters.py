from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_lobsters(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    page = pagination_state.get("page", 1)
    
    url = f"https://lobste.rs/hottest.json?page={page}"
    
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
            "source": "lobsters",
            "target_url": item.get("url", url),
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "text",
            "raw_content": f"Title: {title}\n\n{description}",
            "metadata": {
                "author": item.get("submitter_user", {}).get("username", ""),
                "score": item.get("score", 0),
                "tags": item.get("tags", [])
            }
        })
        
    pagination_state["page"] = page + 1
    return results, pagination_state
