from typing import Any, Dict, List
from bs4 import BeautifulSoup
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_capterra(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts reviews from Capterra.
    Similar hybrid strategy to G2.
    """
    results = []
    current_page = pagination_state.get("page", 1)
    
    target_url = config.urls[0]
    
    # Construct paginated URL
    url = f"{target_url}?page={current_page}"
    
    resp = await extractor.get(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Extract reviews
    reviews = soup.select('div[class*="ReviewCard"]')
    
    for review in reviews:
        title_elem = review.select_one('h3')
        title = title_elem.text.strip() if title_elem else "Untitled Capterra Review"
        
        body_elem = review.select_one('div[class*="ReviewText"]')
        body = body_elem.text.strip() if body_elem else ""
        
        if title and body:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "capterra",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": f"Title: {title}\n\n{body}",
                "metadata": {
                    "page": current_page
                }
            })
            
    # Update pagination state
    pagination_state["page"] = current_page + 1
    
    return results, pagination_state
