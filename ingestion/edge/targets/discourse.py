import urllib.parse
from typing import Any, Dict, List
import uuid
import datetime
import structlog

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig

logger = structlog.get_logger(__name__)


async def extract_discourse(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts topics from a Discourse forum via direct JSON API.

    - WAF: Typically minimal — direct REST API access via curl_cffi
    - Strategy: Hits /latest.json and /c/{category}.json endpoints directly
    - Durable pagination via topic_id high-water-mark stored in Temporal workflow state
    - Configurable target instances: meta.discourse.org, community.render.com, etc.
    - Extracts: topic title, post content (first 5 posts), view count, reply count, author, timestamps
    """
    results = []

    base_url = config.urls[0].rstrip("/")

    # Determine if we should use /latest.json or a specific category endpoint
    if "/c/" in base_url:
        # Category endpoint — append .json
        if not base_url.endswith(".json"):
            base_url += ".json"
    else:
        # Default to /latest.json
        if not base_url.endswith("/latest.json"):
            base_url = urllib.parse.urljoin(base_url + "/", "latest.json")

    page = pagination_state.get("page", 0)
    highest_topic_id = pagination_state.get("highest_topic_id", 0)

    url = f"{base_url}?page={page}"

    resp = await extractor.get(url)
    try:
        data = resp.json()
    except Exception as e:
        # If it's not JSON, we probably hit a WAF block page (HTML)
        from ingestion.edge.errors.exceptions import SilentBlockError
        raise SilentBlockError(f"Failed to decode JSON from {url}. Received: {resp.text[:200]}") from e

    topics = data.get("topic_list", {}).get("topics", [])

    if not topics:
        # Reached the end — reset pagination for next cycle
        pagination_state["page"] = 0
        return results, pagination_state

    new_highest = highest_topic_id

    for topic in topics:
        topic_id = topic.get("id", 0)

        # High-water-mark check: skip topics we've already processed
        if topic_id <= highest_topic_id:
            continue

        title = topic.get("title", "")
        view_count = topic.get("views", 0)
        reply_count = topic.get("reply_count", topic.get("posts_count", 1) - 1)
        created_at = topic.get("created_at", "")
        last_posted_at = topic.get("last_posted_at", "")
        author = topic.get("last_poster_username", "")
        category_id = topic.get("category_id", None)
        tags = topic.get("tags", [])

        # Fetch first 5 posts from the topic detail endpoint
        post_contents = []
        forum_base = config.urls[0].rstrip("/")
        if "/c/" in forum_base:
            forum_base = forum_base.split("/c/")[0]

        try:
            topic_detail_url = f"{forum_base}/t/{topic_id}.json"
            topic_resp = await extractor.get(topic_detail_url)
            topic_data = topic_resp.json()

            post_stream = topic_data.get("post_stream", {}).get("posts", [])
            for post in post_stream[:5]:  # First 5 posts only
                post_cooked = post.get("cooked", "")  # HTML content
                post_raw = post.get("raw", "")  # Raw markdown (if available)
                post_author = post.get("username", "")
                post_created = post.get("created_at", "")
                post_contents.append({
                    "author": post_author,
                    "created_at": post_created,
                    "content": post_raw if post_raw else post_cooked
                })
        except Exception as e:
            logger.warn("discourse_topic_fetch_failed", topic_id=topic_id, error=str(e))

        # Build raw content
        raw_parts = [f"Title: {title}"]
        for i, pc in enumerate(post_contents):
            raw_parts.append(f"\n--- Post {i+1} by {pc['author']} ---\n{pc['content']}")

        raw_content = "\n".join(raw_parts) if raw_parts else f"Title: {title}"

        results.append({
            "id": str(uuid.uuid4()),
            "source": "discourse",
            "target_url": f"{forum_base}/t/{topic_id}",
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_type": "json",
            "raw_content": raw_content,
            "metadata": {
                "topic_id": topic_id,
                "title": title,
                "view_count": view_count,
                "reply_count": reply_count,
                "author": author,
                "created_at": created_at,
                "last_posted_at": last_posted_at,
                "category_id": category_id,
                "tags": tags,
                "post_count_fetched": len(post_contents)
            }
        })

        # Track HWM
        if topic_id > new_highest:
            new_highest = topic_id

    pagination_state["page"] = page + 1
    pagination_state["highest_topic_id"] = new_highest

    return results, pagination_state
