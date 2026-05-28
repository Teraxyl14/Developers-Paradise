from typing import Any, Dict, List
from bs4 import BeautifulSoup
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

async def extract_g2(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts reviews from G2.
    Uses Playwright DOM hydration via the Extractor (if implemented that way),
    or if Stage 1 already got the clearance cookie, we just use curl_cffi.
    """
    results = []
    current_page = pagination_state.get("page", 1)
    
    # We will just scrape the first URL for now
    target_url = config.urls[0]
    
    # Construct paginated URL
    url = f"{target_url}?page={current_page}"
    
    resp = await extractor.get(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Very basic XPath/CSS extraction based on typical G2 structure
    # In a real 2026 scenario, these selectors would be highly dynamic
    reviews = soup.find_all('div', itemprop="review")
    
    for review in reviews:
        title_elem = review.find(itemprop="name")
        title = title_elem.text.strip() if title_elem else "Untitled G2 Review"
        
        # G2 usually splits reviews into "What do you like best" and "What do you dislike"
        body_parts = []
        for p in review.find_all('p'):
            text = p.text.strip()
            if text:
                body_parts.append(text)
                
        body = "\n\n".join(body_parts)
        
        if title and body:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "g2",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": f"Title: {title}\n\n{body}",
                "metadata": {
                    "page": current_page,
                    "author": "G2 User"
                }
            })
            
    # Update pagination state
    pagination_state["page"] = current_page + 1
    
    return results, pagination_state
