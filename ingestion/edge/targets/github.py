from typing import Any, Dict, List
import uuid
import datetime
import urllib.parse

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_github(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """Extracts from GitHub Issues using REST API."""
    results = []
    page = pagination_state.get("page", 1)
    
    # URL should be of form "owner/repo"
    repo = config.urls[0]
    
    # We search for open issues with labels like 'bug', 'enhancement', 'feature'
    query = f"repo:{repo} is:issue is:open"
    encoded_query = urllib.parse.quote(query)
    
    url = f"https://api.github.com/search/issues?q={encoded_query}&per_page=100&page={page}"
    
    # Ensure accept header is set
    extractor.session.headers.update({
        "Accept": "application/vnd.github.v3+json"
    })
    
    resp = await extractor.get(url)
    data = resp.json()
    
    items = data.get("items", [])
    if not items:
        pagination_state["page"] = 1 # reset
        return results, pagination_state
        
    for item in items:
        title = item.get("title", "")
        body = item.get("body", "")
        
        if title and body:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "github",
                "target_url": item.get("html_url", url),
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "markdown",
                "raw_content": f"Title: {title}\n\n{body}",
                "metadata": {
                    "issue_number": item.get("number"),
                    "author": item.get("user", {}).get("login", "Unknown")
                }
            })
            
    pagination_state["page"] = page + 1
    return results, pagination_state
