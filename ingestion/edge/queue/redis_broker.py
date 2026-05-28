import json
from typing import List, Dict, Any
import redis.asyncio as redis
import structlog

from ingestion.edge.config.settings import settings

logger = structlog.get_logger(__name__)

class RedisBroker:
    """Handles pushing raw payloads to the cloud Redis queue."""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_key = "dp:raw_payloads"
        
    async def push_batch(self, payloads: List[Dict[str, Any]]):
        """RPUSH a batch of payloads to the queue tail."""
        if not payloads:
            return
            
        json_payloads = [json.dumps(p) for p in payloads]
        
        try:
            # We use an atomic pipeline to push all at once
            async with self.redis_client.pipeline(transaction=True) as pipe:
                for jp in json_payloads:
                    pipe.rpush(self.queue_key, jp)
                await pipe.execute()
            logger.info("pushed_payloads", count=len(payloads), queue=self.queue_key)
        except Exception as e:
            logger.error("redis_push_failed", error=str(e))
            raise

    async def close(self):
        await self.redis_client.close()
