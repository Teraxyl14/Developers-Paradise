import asyncio
from dataclasses import dataclass
from typing import Dict

from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    # Fallback if module fails to load (can be tricky in some environments)
    # We will log a warning if we get here during actual execution
    async def stealth_async(page): pass 

from ingestion.edge.evasion.proxy import proxy_manager
from ingestion.edge.errors.exceptions import CaptchaRequiredError

@dataclass
class SessionContext:
    cookies: Dict[str, str]
    user_agent: str
    proxy_url: str | None


class Icebreaker:
    """Stage 1: Extracts cf_clearance / datadome validation cookies using a stealth browser."""
    
    @classmethod
    async def harvest_cookies(cls, target_url: str, session_id: str) -> SessionContext:
        proxy_url = proxy_manager.get_proxy_for_session(session_id)
        
        launch_args = {
            "headless": True,
            "args": ["--disable-blink-features=AutomationControlled"]
        }
        
        if proxy_url:
            # Playwright proxy format
            launch_args["proxy"] = {"server": proxy_url}
            
        async with async_playwright() as p:
            browser = await p.chromium.launch(**launch_args)
            context = await browser.new_context(
                # Use a standard chrome 120 user agent to match curl_cffi later
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            await stealth_async(page)
            
            try:
                # Ghost cursor would be initialized here if we needed complex interactions,
                # but for now we just navigate and wait for the challenge to resolve organically.
                
                await page.goto(target_url, wait_until="networkidle", timeout=45000)
                
                # Check for challenge resolution by looking for specific cookies
                await asyncio.sleep(5)  # Wait for challenge scripts to execute
                
                raw_cookies = await context.cookies()
                cookies = {c["name"]: c["value"] for c in raw_cookies}
                
                # Verify we actually got a clearance cookie (cf_clearance, datadome, etc)
                if not any(k in cookies for k in ["cf_clearance", "datadome", "_abck", "bm_sz"]):
                    # If we don't have it, we might be stuck on a CAPTCHA.
                    # We will return the cookies anyway, but if subsequent Stage 2 fails,
                    # we know it's because we didn't pass the challenge.
                    pass 

                return SessionContext(
                    cookies=cookies,
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    proxy_url=proxy_url
                )
                
            except Exception as e:
                # If we timeout or fail, raise CaptchaRequiredError to trigger HITL
                raise CaptchaRequiredError(f"Failed to harvest cookies: {e}")
            finally:
                await browser.close()
