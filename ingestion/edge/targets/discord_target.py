from typing import Any, Dict, List
import uuid
import datetime

from ingestion.edge.evasion.extractor import Extractor
from ingestion.edge.config.targets import TargetConfig
from ingestion.edge.config.settings import settings
from ingestion.edge.errors.exceptions import AuthError, RateLimitError

async def extract_discord(extractor: Extractor, config: TargetConfig, pagination_state: dict) -> tuple[List[Dict[str, Any]], dict]:
    """
    Extracts messages from Discord channels via REST API.
    Handles strict Retry-After and bot token auth.
    """
    if not settings.discord_bot_token:
        raise AuthError("DISCORD_BOT_TOKEN is not set.")
        
    results = []
    
    # We treat config.urls as a list of channel IDs for Discord
    channel_id = config.urls[0]
    
    # Add Authorization header
    extractor.session.headers.update({
        "Authorization": f"Bot {settings.discord_bot_token}"
    })
    
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=50"
    
    before_id = pagination_state.get("before")
    if before_id:
        url += f"&before={before_id}"
        
    resp = await extractor.get(url)
    
    if resp.status_code in (401, 403):
        raise AuthError(f"Discord API auth failed: {resp.status_code}")
        
    messages = resp.json()
    
    if not messages:
        # Reached the end, clear pagination to start over next cycle
        pagination_state["before"] = None
        return results, pagination_state
        
    oldest_message_id = None
    
    for msg in messages:
        oldest_message_id = msg.get("id")
        content = msg.get("content", "")
        author = msg.get("author", {}).get("username", "Unknown")
        
        if content:
            results.append({
                "id": str(uuid.uuid4()),
                "source": "discord",
                "target_url": url,
                "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "content_type": "json",
                "raw_content": content,
                "metadata": {
                    "message_id": oldest_message_id,
                    "author": author,
                    "channel_id": channel_id
                }
            })
            
    if oldest_message_id:
        pagination_state["before"] = oldest_message_id
        
    return results, pagination_state
