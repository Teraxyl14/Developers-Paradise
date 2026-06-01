from curl_cffi import requests
from typing import Dict, Any, List, Callable, Optional
import structlog

from ingestion.edge.evasion.icebreaker import SessionContext
from ingestion.edge.errors.exceptions import RateLimitError, SilentBlockError, SessionExpiredError

logger = structlog.get_logger(__name__)


class Extractor:
    """
    Stage 2: High-speed extraction using curl_cffi for TLS impersonation.
    
    - Creates a curl_cffi AsyncSession with impersonate="chrome120"
    - Injects cookies and User-Agent from Stage 1's SessionContext
    - Routes through the same proxy IP (sticky session) used in Stage 1
    - On HTTP 403: raises SessionExpiredError (clearance cookie expired)
    - On HTTP 429: raises RateLimitError with retry_after — does NOT retry internally
    - On HTTP 200 with empty body: raises SilentBlockError (Akamai silent fail)
    """

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
        """Executes a GET request with error mapping to typed exceptions."""
        resp = await self.session.get(url, **kwargs)

        # Check for rate limits (429 Too Many Requests)
        if resp.status_code == 429:
            retry_after = 60.0  # default
            if "Retry-After" in resp.headers:
                try:
                    retry_after = float(resp.headers["Retry-After"])
                except ValueError:
                    pass
            raise RateLimitError(
                retry_after=retry_after,
                message=f"429 Rate Limit on {url}. Retry after {retry_after}s"
            )

        # Check for WAF blocks (403 Forbidden) — clearance cookie expired
        if resp.status_code == 403:
            raise SessionExpiredError(
                f"403 Forbidden on {url}. Clearance cookie likely expired — re-run Icebreaker."
            )

        # Check for Akamai silent fail (200 OK but empty or challenge body)
        if resp.status_code == 200 and not resp.text.strip():
            raise SilentBlockError(f"Silent block detected on {url} (Empty 200 OK)")

        return resp

    async def paginate(
        self,
        url_template: str,
        page_key: str = "page",
        start_page: int = 1,
        max_pages: int = 50,
        parser: Optional[Callable[[requests.Response], List[Dict[str, Any]]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Paginates through a URL template, collecting results.
        
        Args:
            url_template: URL with {page} placeholder, e.g. "https://example.com/reviews?page={page}"
            page_key: The placeholder name in the template (default: "page")
            start_page: Starting page number
            max_pages: Maximum pages to iterate
            parser: Optional callable that extracts items from a response. If None, returns raw JSON.
        
        Returns:
            Aggregated list of all extracted items across all pages.
        
        Raises:
            RateLimitError, SessionExpiredError, SilentBlockError — propagated from get()
        """
        all_results: List[Dict[str, Any]] = []

        for page_num in range(start_page, start_page + max_pages):
            url = url_template.replace(f"{{{page_key}}}", str(page_num))
            logger.debug("paginating", url=url, page=page_num)

            resp = await self.get(url)

            if parser:
                items = parser(resp)
            else:
                items = resp.json() if resp.text.strip() else []

            if not items:
                logger.info("pagination_exhausted", page=page_num)
                break

            all_results.extend(items)

        return all_results

    async def close(self):
        await self.session.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
