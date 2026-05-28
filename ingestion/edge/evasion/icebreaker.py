import asyncio
from dataclasses import dataclass
from typing import Dict
import structlog

from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    async def stealth_async(page): pass

try:
    from ghost_cursor_playwright import create_cursor
except ImportError:
    create_cursor = None

from ingestion.edge.evasion.proxy import proxy_manager
from ingestion.edge.errors.exceptions import CaptchaRequiredError

logger = structlog.get_logger(__name__)

CHROME_120_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


@dataclass
class SessionContext:
    """Encapsulates session state passed from Stage 1 (Icebreaker) to Stage 2 (Extractor)."""
    cookies: Dict[str, str]
    user_agent: str
    proxy_url: str | None


class Icebreaker:
    """
    Stage 1: Cookie Harvester.
    
    - Instantiates Playwright (Chromium) with playwright-stealth patches
    - Routes through a sticky residential proxy (single IP for the full session)
    - Uses ghost-cursor for non-linear Bezier mouse movements to defeat behavioral ML
    - Navigates to the target domain, waits for challenge resolution
    - Extracts validation cookies (cf_clearance, datadome, _abck, bm_sz) + User-Agent
    - Timeout: 60s before raising CaptchaRequiredError for HITL fallback
    """

    CHALLENGE_TIMEOUT_MS = 60000  # 60 seconds as specified in plan
    CHALLENGE_SETTLE_WAIT = 5  # Seconds to wait for challenge scripts to settle

    @classmethod
    async def harvest_cookies(cls, target_url: str, session_id: str) -> SessionContext:
        proxy_url = proxy_manager.get_proxy_for_session(session_id)

        launch_args = {
            "headless": True,
            "args": ["--disable-blink-features=AutomationControlled"]
        }

        if proxy_url:
            launch_args["proxy"] = {"server": proxy_url}

        async with async_playwright() as p:
            browser = await p.chromium.launch(**launch_args)
            context = await browser.new_context(
                user_agent=CHROME_120_UA,
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
            )
            page = await context.new_page()

            # Apply stealth patches to strip automation flags
            await stealth_async(page)

            # Initialize ghost-cursor for non-linear Bezier mouse movements
            cursor = None
            if create_cursor:
                try:
                    cursor = create_cursor(page)
                    logger.info("ghost_cursor_initialized", target=target_url)
                except Exception as e:
                    logger.warn("ghost_cursor_init_failed", error=str(e))

            try:
                logger.info("icebreaker_navigating", url=target_url)
                await page.goto(
                    target_url,
                    wait_until="networkidle",
                    timeout=cls.CHALLENGE_TIMEOUT_MS
                )

                # Simulate human-like mouse movement if ghost-cursor is available
                if cursor:
                    try:
                        await cursor.move_to({"x": 400, "y": 300})
                        await asyncio.sleep(0.5)
                        await cursor.move_to({"x": 600, "y": 500})
                    except Exception:
                        pass  # Non-critical — best-effort behavioral simulation

                # Wait for challenge scripts to execute and issue cookies
                await asyncio.sleep(cls.CHALLENGE_SETTLE_WAIT)

                raw_cookies = await context.cookies()
                cookies = {c["name"]: c["value"] for c in raw_cookies}

                # Verify we got a clearance cookie
                clearance_keys = ["cf_clearance", "datadome", "_abck", "bm_sz"]
                has_clearance = any(k in cookies for k in clearance_keys)

                if has_clearance:
                    logger.info(
                        "icebreaker_success",
                        url=target_url,
                        cookies_harvested=[k for k in clearance_keys if k in cookies]
                    )
                else:
                    logger.warn(
                        "icebreaker_no_clearance_cookie",
                        url=target_url,
                        cookies_present=list(cookies.keys())[:10]
                    )

                return SessionContext(
                    cookies=cookies,
                    user_agent=CHROME_120_UA,
                    proxy_url=proxy_url
                )

            except Exception as e:
                logger.error("icebreaker_failed", url=target_url, error=str(e))
                raise CaptchaRequiredError(
                    f"Icebreaker failed for {target_url}: {e}. "
                    f"Manual CAPTCHA resolution required — send 'captcha_solved' signal."
                )
            finally:
                await browser.close()
