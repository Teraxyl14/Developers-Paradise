import random
from typing import Optional
from urllib.parse import urlparse, urlunparse

from ingestion.edge.config.settings import settings


class ProxyManager:
    def __init__(self):
        self.gateway_url = settings.proxy_gateway_url
        self.username = settings.proxy_username
        self.password = settings.proxy_password

    def get_proxy_for_session(self, session_id: str) -> Optional[str]:
        """
        Generates a proxy string for a given session.
        If using a rotating provider, it appends the session_id to the username
        to guarantee sticky routing (e.g., BrightData, Smartproxy).
        """
        if not self.gateway_url:
            return None

        parsed = urlparse(self.gateway_url)
        
        if self.username and self.password:
            # Sticky routing pattern: user-session-{session_id}
            sticky_user = f"{self.username}-session-{session_id}"
            netloc = f"{sticky_user}:{self.password}@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
                
            return urlunparse((
                parsed.scheme,
                netloc,
                parsed.path,
                parsed.params,
                parsed.query,
                parsed.fragment
            ))
            
        return self.gateway_url

proxy_manager = ProxyManager()
