from typing import Any, Dict, List
import uuid
import datetime
import structlog

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig
from ingestion.edge.config.settings import settings
from ingestion.edge.errors.exceptions import AuthError, RateLimitError

logger = structlog.get_logger(__name__)


async def extract_discord(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts messages from Discord channels via official REST API.
    
    - Uses authorized bot token with MESSAGE_CONTENT intent
    - Endpoint: /channels/{channel_id}/messages?limit=50
    - Strict Retry-After header compliance (propagated via extractor.get → RateLimitError)
    - Tracks pagination via 'before' message ID parameter (high-water-mark)
    - Handles HTTP 401/403 explicitly as AuthError (bot token invalid/insufficient permissions)
    """
    if not settings.discord_bot_token:
        raise AuthError(
            "DISCORD_BOT_TOKEN is not set. Provision a bot token with "
            "MESSAGE_CONTENT intent enabled in the Discord Developer Portal."
        )

    results = []

    # config.urls contains channel IDs for Discord targets
    channel_id = config.urls[0]

    # Override the User-Agent and add Discord bot Authorization header
    # We do this directly on the session so it applies to all requests in this extraction
    extractor.session.headers.update({
        "Authorization": f"Bot {settings.discord_bot_token}",
        "Content-Type": "application/json"
    })

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=50"

    before_id = pagination_state.get("before")
    if before_id:
        url += f"&before={before_id}"

    # We need to bypass the generic 403→SessionExpiredError mapping in Extractor.get()
    # because for Discord, 403 means "insufficient bot permissions", not "WAF clearance expired".
    # So we use the raw session directly and handle status codes ourselves.
    resp = await extractor.session.get(url)

    # Discord-specific auth error handling
    if resp.status_code == 401:
        raise AuthError(
            f"Discord API returned 401 Unauthorized for channel {channel_id}. "
            f"The bot token is invalid or has been revoked."
        )
    if resp.status_code == 403:
        raise AuthError(
            f"Discord API returned 403 Forbidden for channel {channel_id}. "
            f"The bot lacks required permissions (ensure MESSAGE_CONTENT intent is enabled "
            f"and the bot has 'Read Messages' permission in this channel)."
        )

    # Handle rate limiting — Discord enforces strict per-route limits
    if resp.status_code == 429:
        retry_after = 60.0
        if "Retry-After" in resp.headers:
            try:
                retry_after = float(resp.headers["Retry-After"])
            except ValueError:
                pass
        raise RateLimitError(
            retry_after=retry_after,
            message=f"Discord 429 rate limit on channel {channel_id}. Retry after {retry_after}s"
        )

    if resp.status_code != 200:
        logger.warn("discord_unexpected_status", status=resp.status_code, channel=channel_id)
        return results, pagination_state

    messages = resp.json()

    if not messages:
        # Reached the end of history — clear pagination to start fresh next cycle
        pagination_state["before"] = None
        return results, pagination_state

    oldest_message_id = None

    for msg in messages:
        msg_id = msg.get("id")
        oldest_message_id = msg_id  # Track the last (oldest) message for pagination
        content = msg.get("content", "")
        author = msg.get("author", {}).get("username", "Unknown")
        timestamp = msg.get("timestamp", "")
        attachments = [a.get("url", "") for a in msg.get("attachments", [])]

        if content:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "discord",
                "target_url": f"https://discord.com/channels/-/{channel_id}/{msg_id}",
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "json",
                "raw_content": content,
                "metadata": {
                    "message_id": msg_id,
                    "author": author,
                    "channel_id": channel_id,
                    "timestamp": timestamp,
                    "attachments": attachments
                }
            })

    if oldest_message_id:
        pagination_state["before"] = oldest_message_id

    return results, pagination_state
