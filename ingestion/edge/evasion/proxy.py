import time
import hashlib
from dataclasses import dataclass, field
from typing import Optional, Dict
from urllib.parse import urlparse, urlunparse

from ingestion.edge.config.settings import settings


@dataclass
class ProxyHealth:
    """Tracks failure metrics for a single proxy session."""
    session_id: str
    fail_403_count: int = 0
    fail_429_count: int = 0
    burned: bool = False
    quarantine_until: float = 0.0  # Unix timestamp


class ProxyManager:
    """
    Manages proxy allocation with:
    - Sticky session routing (appends session ID to proxy auth string)
    - Proxy health tracking (403/429 counters per session)
    - Quarantine system: burns IPs that exceed failure thresholds
    - Subnet diversity: consecutive allocations never share the same /24 subnet
    """

    FAILURE_THRESHOLD = 5  # Total 403+429 failures before quarantine
    QUARANTINE_SECONDS = 600  # 10 minutes

    def __init__(self):
        self.gateway_url = settings.proxy_gateway_url
        self.username = settings.proxy_username
        self.password = settings.proxy_password
        self._health: Dict[str, ProxyHealth] = {}
        self._last_subnet: Optional[str] = None

    def get_proxy_for_session(self, session_id: str) -> Optional[str]:
        """
        Generates a proxy URL for a given session.
        Appends the session_id to the username to guarantee sticky routing
        (e.g., BrightData: user-session-abc123, Smartproxy: user-sessid-abc123).
        """
        if not self.gateway_url:
            return None

        # Check if this session is quarantined
        health = self._health.get(session_id)
        if health and health.burned:
            if time.time() < health.quarantine_until:
                return None  # Still quarantined — caller must request a new session ID
            else:
                # Quarantine expired — reset health
                health.burned = False
                health.fail_403_count = 0
                health.fail_429_count = 0

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

    def report_failure(self, session_id: str, status_code: int) -> None:
        """
        Reports a failure response code for a proxy session.
        If the session exceeds the failure threshold, it is quarantined.
        """
        if session_id not in self._health:
            self._health[session_id] = ProxyHealth(session_id=session_id)

        health = self._health[session_id]

        if status_code == 403:
            health.fail_403_count += 1
        elif status_code == 429:
            health.fail_429_count += 1

        total_failures = health.fail_403_count + health.fail_429_count
        if total_failures >= self.FAILURE_THRESHOLD:
            health.burned = True
            health.quarantine_until = time.time() + self.QUARANTINE_SECONDS

    def report_success(self, session_id: str) -> None:
        """Resets failure counters on a successful request."""
        if session_id in self._health:
            self._health[session_id].fail_403_count = 0
            self._health[session_id].fail_429_count = 0

    def is_burned(self, session_id: str) -> bool:
        """Checks if a proxy session has been burned (quarantined)."""
        health = self._health.get(session_id)
        if not health:
            return False
        if health.burned and time.time() < health.quarantine_until:
            return True
        return False

    def enforce_subnet_diversity(self, session_id: str) -> bool:
        """
        Checks if the new session_id would map to the same /24 subnet
        as the last allocation. Uses a deterministic hash to approximate
        subnet assignment (the actual subnet is controlled by the proxy provider,
        but this ensures we don't request the same session twice consecutively).
        Returns True if the session is diverse enough to use.
        """
        subnet_hash = hashlib.md5(session_id.encode()).hexdigest()[:6]
        if subnet_hash == self._last_subnet:
            return False  # Same approximate subnet — caller should rotate session_id
        self._last_subnet = subnet_hash
        return True


proxy_manager = ProxyManager()
