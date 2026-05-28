from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    temporal_host: str = "localhost:7233"
    temporal_namespace: str = "default"
    
    # Proxy Config (Optional)
    proxy_gateway_url: Optional[str] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None

    # Target specific
    discord_bot_token: Optional[str] = None
    
    captcha_webhook_url: Optional[str] = None
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
