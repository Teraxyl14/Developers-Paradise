from typing import List, Dict, Any, Tuple
from temporalio import activity

from ingestion.edge.config.targets import TargetConfig
from ingestion.edge.evasion.icebreaker import Icebreaker, SessionContext
from ingestion.edge.evasion.extractor import Extractor

# Import target functions
from ingestion.edge.targets.g2 import extract_g2
from ingestion.edge.targets.capterra import extract_capterra
from ingestion.edge.targets.discourse import extract_discourse
from ingestion.edge.targets.discord_target import extract_discord
from ingestion.edge.targets.github import extract_github
from ingestion.edge.targets.stackoverflow import extract_stackoverflow
from ingestion.edge.targets.hackernews import extract_hackernews
from ingestion.edge.targets.reddit import extract_reddit
from ingestion.edge.targets.lobsters import extract_lobsters
from ingestion.edge.targets.devto import extract_devto
from ingestion.edge.targets.rss_feeds import extract_rss_feeds


@activity.defn
async def icebreaker_activity(session_id: str, target_url: str) -> SessionContext:
    """Stage 1: Harvests cookies using Playwright."""
    return await Icebreaker.harvest_cookies(target_url, session_id)


@activity.defn
async def extract_activity(
    session_ctx: SessionContext | None,
    target_config: TargetConfig,
    pagination_state: dict
) -> Tuple[List[Dict[str, Any]], dict]:
    """Stage 2: Executes target-specific extraction via curl_cffi."""
    
    # If no session context provided (e.g. for non-WAF targets), create an empty one
    if not session_ctx:
        session_ctx = SessionContext(cookies={}, user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0", proxy_url=None)
        
    async with Extractor(session_ctx) as extractor:
        # Route to specific target function based on target_type
        if target_config.target_type == "g2":
            return await extract_g2(extractor, target_config, pagination_state)
        elif target_config.target_type == "capterra":
            return await extract_capterra(extractor, target_config, pagination_state)
        elif target_config.target_type == "discourse":
            return await extract_discourse(extractor, target_config, pagination_state)
        elif target_config.target_type == "discord":
            return await extract_discord(extractor, target_config, pagination_state)
        elif target_config.target_type == "github":
            return await extract_github(extractor, target_config, pagination_state)
        elif target_config.target_type == "stackoverflow":
            return await extract_stackoverflow(extractor, target_config, pagination_state)
        elif target_config.target_type == "hackernews":
            return await extract_hackernews(extractor, target_config, pagination_state)
        elif target_config.target_type == "reddit":
            return await extract_reddit(extractor, target_config, pagination_state)
        elif target_config.target_type == "lobsters":
            return await extract_lobsters(extractor, target_config, pagination_state)
        elif target_config.target_type == "devto":
            return await extract_devto(extractor, target_config, pagination_state)
        elif target_config.target_type == "rss":
            return await extract_rss_feeds(extractor, target_config, pagination_state)
        else:
            raise ValueError(f"Unknown target type: {target_config.target_type}")
