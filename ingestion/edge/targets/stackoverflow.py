from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_stackoverflow(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    results = []
    page = pagination_state.get("page", 1)
    
    tag = config.urls[0]
    
    url = f"https://api.stackexchange.com/2.3/questions?order=desc&sort=creation&tagged={tag}&site=stackoverflow&filter=withbody&pagesize=50&page={page}"
    
    resp = await extractor.get(url)
    data = resp.json()
    
    items = data.get("items", [])
    if not items:
        pagination_state["page"] = 1
        return results, pagination_state
        
    for item in items:
        title = item.get("title", "")
        body = item.get("body_markdown", item.get("body", ""))
        
        results.append({
            "id": str(uuid.uuid4()),
            "source": "stackoverflow",
            "target_url": item.get("link", url),
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "text",
            "raw_content": f"Title: {title}\n\n{body}",
            "metadata": {
                "question_id": item.get("question_id"),
                "score": item.get("score", 0),
                "tags": item.get("tags", [])
            }
        })
        
    pagination_state["page"] = page + 1
    return results, pagination_state
