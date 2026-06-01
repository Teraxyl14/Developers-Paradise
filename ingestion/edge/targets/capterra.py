from typing import Any, Dict, List
from bs4 import BeautifulSoup
import uuid
import datetime
import structlog

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

logger = structlog.get_logger(__name__)


async def extract_capterra(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts reviews from Capterra.

    - Same hybrid strategy as G2 (DOM hydration + CSS/XPath extraction)
    - Different DOM structure and pagination model
    - Extracts: review text, pros/cons sections, overall/ease-of-use/features ratings
    """
    results = []
    current_page = pagination_state.get("page", 1)

    target_url = config.urls[0]
    url = f"{target_url}?page={current_page}"

    resp = await extractor.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")

    # Capterra review containers — CSS class patterns vary but typically use ReviewCard
    reviews = soup.select('div[class*="ReviewCard"], div[class*="review-card"], div[itemprop="review"]')

    if not reviews:
        logger.debug("capterra_no_reviews_found", url=url, page=current_page)

    for review in reviews:
        # Title
        title_elem = review.select_one('h3, [class*="ReviewTitle"], [itemprop="name"]')
        title = title_elem.text.strip() if title_elem else "Untitled Capterra Review"

        # Overall rating
        overall_rating = None
        rating_elem = review.select_one('[class*="overall-rating"], [itemprop="ratingValue"]')
        if rating_elem:
            try:
                overall_rating = float(rating_elem.get("content", rating_elem.text.strip()))
            except (ValueError, TypeError):
                pass

        # Granular ratings (ease-of-use, features, value-for-money, customer-support)
        ease_of_use = _extract_sub_rating(review, "ease-of-use")
        features_rating = _extract_sub_rating(review, "features")
        value_for_money = _extract_sub_rating(review, "value-for-money")
        customer_support = _extract_sub_rating(review, "customer-support")

        # Pros section
        pros_elem = review.select_one('[class*="Pros"], [class*="pros"]')
        pros = pros_elem.text.strip() if pros_elem else ""

        # Cons section
        cons_elem = review.select_one('[class*="Cons"], [class*="cons"]')
        cons = cons_elem.text.strip() if cons_elem else ""

        # Full review text (fallback if pros/cons not found)
        body_elem = review.select_one('div[class*="ReviewText"], div[class*="review-body"]')
        full_body = body_elem.text.strip() if body_elem else ""

        # Build raw content with structured sections
        raw_parts = [f"Title: {title}"]
        if pros:
            raw_parts.append(f"Pros:\n{pros}")
        if cons:
            raw_parts.append(f"Cons:\n{cons}")
        if full_body and not pros and not cons:
            raw_parts.append(f"Review:\n{full_body}")

        raw_content = "\n\n".join(raw_parts)

        if title:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "capterra",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": raw_content,
                "metadata": {
                    "page": current_page,
                    "overall_rating": overall_rating,
                    "ease_of_use": ease_of_use,
                    "features": features_rating,
                    "value_for_money": value_for_money,
                    "customer_support": customer_support
                }
            })

    pagination_state["page"] = current_page + 1
    return results, pagination_state


def _extract_sub_rating(review_element: BeautifulSoup, rating_name: str) -> float | None:
    """Extracts a specific sub-rating (e.g., ease-of-use) from a review element."""
    elem = review_element.select_one(f'[class*="{rating_name}"] [class*="rating-value"], [data-rating-category="{rating_name}"]')
    if elem:
        try:
            return float(elem.text.strip())
        except (ValueError, TypeError):
            pass
    return None
