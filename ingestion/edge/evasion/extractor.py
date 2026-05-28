from curl_cffi import requests
from typing import Dict, Any

from ingestion.edge.evasion.icebreaker import SessionContext
from ingestion.edge.errors.exceptions import RateLimitError, SilentBlockError


class Extractor:
    """Stage 2: High-speed extraction using curl_cffi for TLS impersonation."""
    
    def __init__(self, session_context: SessionContext):
        self.context = session_context
        
        proxies = None
        if self.context.proxy_url:
            proxies = {
                "http": self.context.proxy_url,
                "https": self.context.proxy_url
            }
            
        self.session = requests.AsyncSession(
            impersonate="chrome120",
            cookies=self.context.cookies,
            headers={"User-Agent": self.context.user_agent},
            proxies=proxies,
            verify=False  # Required for some proxies
        )

    async def get(self, url: str, **kwargs) -> requests.Response:
        """Executes a GET request with error mapping."""
        resp = await self.session.get(url, **kwargs)
        
        # Check for rate limits (429 Too Many Requests)
        if resp.status_code == 429:
            retry_after = 60.0  # default
            if "Retry-After" in resp.headers:
                try:
                    retry_after = float(resp.headers["Retry-After"])
                except ValueError:
                    pass
            raise RateLimitError(retry_after=retry_after, message=f"429 Rate Limit on {url}")
            
        # Check for WAF blocks (403 Forbidden)
        if resp.status_code == 403:
             # A 403 generally means our clearance cookie expired or we got detected
             # In a real system, we'd raise SessionExpiredError here to trigger a re-icebreak
             pass

        # Check for Akamai silent fail (200 OK but empty or challenge body)
        if resp.status_code == 200 and not resp.text.strip():
             raise SilentBlockError(f"Silent block detected on {url} (Empty 200 OK)")

        return resp

    async def close(self):
        self.session.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
