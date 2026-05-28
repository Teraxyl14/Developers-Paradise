from dataclasses import dataclass, field
from typing import Literal, List, Optional

@dataclass
class TargetConfig:
    name: str
    target_type: Literal["g2", "capterra", "discourse", "discord", "github", "stackoverflow", "hackernews", "reddit", "lobsters", "devto", "rss"]
    urls: List[str]  # Target URLs or channel IDs
    waf_type: Literal["cloudflare", "datadome", "akamai", "none"] = "none"
    interval_minutes: int = 60
    max_pages: int = 50
    # Additional metadata if needed
    metadata: dict = field(default_factory=dict)
