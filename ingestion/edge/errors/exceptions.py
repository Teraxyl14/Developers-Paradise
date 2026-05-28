class ExtractionError(Exception):
    """Base extraction error."""
    pass

class RateLimitError(ExtractionError):
    """HTTP 429 — contains retry_after seconds for Temporal durable timer."""
    def __init__(self, retry_after: float, message: str = ""):
        self.retry_after = retry_after
        super().__init__(message or f"Rate limited. Retry after {retry_after}s")

class CaptchaRequiredError(ExtractionError):
    """Stage 1 failed to solve challenge autonomously. Triggers HITL signal wait."""
    pass

class SilentBlockError(ExtractionError):
    """Akamai-style silent block — HTTP 200 but empty/hallucinated body."""
    pass

class ProxyBurnedError(ExtractionError):
    """Proxy IP has been permanently flagged. Needs rotation."""
    pass

class SessionExpiredError(ExtractionError):
    """cf_clearance or validation cookie has expired. Re-run Icebreaker."""
    pass

class AuthError(ExtractionError):
    """Authentication or permission error (e.g., Discord 401/403)."""
    pass
