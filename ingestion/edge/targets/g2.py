from typing import Any, Dict, List
from bs4 import BeautifulSoup
from lxml import html as lxml_html
import uuid
import datetime
import structlog

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

logger = structlog.get_logger(__name__)


async def extract_g2(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts reviews from G2.

    - WAF: DataDome → requires full Stage 1 Icebreaker
    - Strategy: Playwright DOM hydration → XPath extraction
    - Extracts: review title, author role, company size, star rating,
                "What do you like best", "What do you dislike", verified badge
    - Paginates by iterating ?page=N (G2 shows 10 reviews/page in 2026)
    - Tracks high-water-mark: highest review ID processed
    - XPath selectors for obfuscated CSS classes
    """
    results = []
    current_page = pagination_state.get("page", 1)
    highest_review_id = pagination_state.get("highest_review_id", "")

    target_url = config.urls[0]
    url = f"{target_url}?page={current_page}"

    resp = await extractor.get(url)

    # Parse with lxml for XPath support (handles obfuscated CSS classes via contains())
    tree = lxml_html.fromstring(resp.text)

    # Also parse with BS4 for hybrid extraction where XPath is overkill
    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract total review count from navigation for pagination ceiling
    # XPath: //a[contains(@href, '/reviews#reviews')]/text()
    review_count_nodes = tree.xpath("//a[contains(@href, '/reviews#reviews')]/text()")
    total_reviews = 0
    if review_count_nodes:
        try:
            # Strip non-numeric characters (e.g., "1,234 Reviews" → 1234)
            count_text = review_count_nodes[0].strip().replace(",", "").split()[0]
            total_reviews = int(count_text)
            logger.debug("g2_total_reviews", count=total_reviews, url=url)
        except (ValueError, IndexError):
            pass

    # G2 review containers — these use itemprop="review" or similar structured data
    reviews = tree.xpath('//div[@itemprop="review"]')

    # Fallback: try BS4 if lxml XPath finds nothing (DOM structure may have changed)
    if not reviews:
        bs4_reviews = soup.find_all("div", itemprop="review")
        # Convert back to tree nodes for consistency? No — just use BS4 directly.
        for review_div in bs4_reviews:
            review_id = review_div.get("id", str(uuid.uuid4()))

            # Skip if we've already processed this review (HWM check)
            if highest_review_id and review_id <= highest_review_id:
                continue

            title_elem = review_div.find(itemprop="name")
            title = title_elem.text.strip() if title_elem else "Untitled G2 Review"

            # Star rating via itemprop="ratingValue"
            rating_elem = review_div.find(itemprop="ratingValue")
            star_rating = float(rating_elem.get("content", 0)) if rating_elem else None

            # Author info
            author_elem = review_div.find(itemprop="author")
            author_name = author_elem.text.strip() if author_elem else "Anonymous"

            # Author role and company size (usually in subtitle span)
            role_elem = review_div.select_one('[class*="role"], [class*="title"]')
            author_role = role_elem.text.strip() if role_elem else ""

            company_elem = review_div.select_one('[class*="company-size"], [class*="CompanySize"]')
            company_size = company_elem.text.strip() if company_elem else ""

            # Verified badge
            verified_elem = review_div.select_one('[class*="verified"], [class*="Verified"]')
            is_verified = verified_elem is not None

            # "What do you like best" and "What do you dislike" sections
            like_best = ""
            dislike = ""
            all_paragraphs = review_div.find_all("p")
            # G2 typically alternates these in specific divs
            like_section = review_div.select_one('[class*="like-best"], [class*="LikeBest"]')
            dislike_section = review_div.select_one('[class*="dislike"], [class*="Dislike"]')

            if like_section:
                like_best = like_section.text.strip()
            if dislike_section:
                dislike = dislike_section.text.strip()

            # Fallback: concatenate all paragraph text
            if not like_best and not dislike:
                body_parts = [p.text.strip() for p in all_paragraphs if p.text.strip()]
                like_best = "\n".join(body_parts)

            raw_content = f"Title: {title}\n\nWhat I Like Best:\n{like_best}"
            if dislike:
                raw_content += f"\n\nWhat I Dislike:\n{dislike}"

            results.append({
                "id": str(uuid.uuid4()),
                "source": "g2",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": raw_content,
                "metadata": {
                    "page": current_page,
                    "review_id": review_id,
                    "star_rating": star_rating,
                    "author": author_name,
                    "author_role": author_role,
                    "company_size": company_size,
                    "verified": is_verified
                }
            })

            # Update HWM
            if review_id > highest_review_id:
                highest_review_id = review_id
    else:
        # lxml XPath path — iterate review nodes
        for review_node in reviews:
            review_id = review_node.get("id", str(uuid.uuid4()))

            if highest_review_id and review_id <= highest_review_id:
                continue

            # Title via XPath
            title_nodes = review_node.xpath('.//span[@itemprop="name"]/text()')
            title = title_nodes[0].strip() if title_nodes else "Untitled G2 Review"

            # Star rating
            rating_nodes = review_node.xpath('.//*[@itemprop="ratingValue"]/@content')
            star_rating = float(rating_nodes[0]) if rating_nodes else None

            # Author
            author_nodes = review_node.xpath('.//*[@itemprop="author"]/text()')
            author_name = author_nodes[0].strip() if author_nodes else "Anonymous"

            # Role — use contains() to handle obfuscated classes
            role_nodes = review_node.xpath('.//*[contains(@class,"role") or contains(@class,"title")]/text()')
            author_role = role_nodes[0].strip() if role_nodes else ""

            # Company size
            company_nodes = review_node.xpath('.//*[contains(@class,"company-size") or contains(@class,"CompanySize")]/text()')
            company_size = company_nodes[0].strip() if company_nodes else ""

            # Verified badge
            verified_nodes = review_node.xpath('.//*[contains(@class,"verified") or contains(@class,"Verified")]')
            is_verified = len(verified_nodes) > 0

            # Like/Dislike sections
            like_nodes = review_node.xpath('.//*[contains(@class,"like-best") or contains(@class,"LikeBest")]//text()')
            dislike_nodes = review_node.xpath('.//*[contains(@class,"dislike") or contains(@class,"Dislike")]//text()')
            like_best = " ".join([t.strip() for t in like_nodes if t.strip()])
            dislike_text = " ".join([t.strip() for t in dislike_nodes if t.strip()])

            if not like_best:
                # Fallback to all paragraph text
                p_nodes = review_node.xpath('.//p/text()')
                like_best = "\n".join([t.strip() for t in p_nodes if t.strip()])

            raw_content = f"Title: {title}\n\nWhat I Like Best:\n{like_best}"
            if dislike_text:
                raw_content += f"\n\nWhat I Dislike:\n{dislike_text}"

            results.append({
                "id": str(uuid.uuid4()),
                "source": "g2",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "text",
                "raw_content": raw_content,
                "metadata": {
                    "page": current_page,
                    "review_id": review_id,
                    "star_rating": star_rating,
                    "author": author_name,
                    "author_role": author_role,
                    "company_size": company_size,
                    "verified": is_verified
                }
            })

            if review_id > highest_review_id:
                highest_review_id = review_id

    # Update pagination state
    pagination_state["page"] = current_page + 1
    pagination_state["highest_review_id"] = highest_review_id

    # If we know total_reviews, cap pagination
    if total_reviews > 0:
        max_calculated_pages = (total_reviews // 10) + 1
        if current_page >= max_calculated_pages:
            pagination_state["page"] = 1  # Reset — we've exhausted all pages

    return results, pagination_state
