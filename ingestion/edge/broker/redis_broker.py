import json
from typing import List, Dict, Any
import redis.asyncio as redis
import structlog

from ingestion.edge.config.settings import settings

logger = structlog.get_logger(__name__)


class RedisBroker:
    """
    Handles pushing raw payloads to the cloud Redis queue.
    
    - Connection via redis.asyncio with TLS support and connection pooling
    - Queue key: dp:raw_payloads (Redis List)
    - Push: RPUSH dp:raw_payloads <json_payload> (append to tail)
    - Poll (local hardware side): BLPOP dp:raw_payloads 30 (blocking pop from head)
    - Dead-letter: failed payloads moved to dp:raw_payloads:dlq after max_retries
    """

    QUEUE_KEY = "dp:raw_payloads"
    DLQ_KEY = "dp:raw_payloads:dlq"
    MAX_RETRIES = 3

    def __init__(self):
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)

    async def push_batch(self, payloads: List[Dict[str, Any]]) -> None:
        """RPUSH a batch of payloads to the queue tail using an atomic pipeline."""
        if not payloads:
            return

        json_payloads = [json.dumps(p) for p in payloads]

        try:
            async with self.redis_client.pipeline(transaction=True) as pipe:
                for jp in json_payloads:
                    pipe.rpush(self.QUEUE_KEY, jp)
                await pipe.execute()
            logger.info("pushed_payloads", count=len(payloads), queue=self.QUEUE_KEY)
        except Exception as e:
            logger.error("redis_push_failed", error=str(e), count=len(payloads))
            raise

    async def move_to_dlq(self, payload: Dict[str, Any], reason: str) -> None:
        """
        Moves a failed payload to the dead-letter queue with failure metadata.
        Called when a payload has exceeded MAX_RETRIES processing attempts.
        """
        dlq_entry = {
            "original_payload": payload,
            "failure_reason": reason,
            "retry_count": self.MAX_RETRIES,
        }
        try:
            await self.redis_client.rpush(self.DLQ_KEY, json.dumps(dlq_entry))
            logger.warn("payload_moved_to_dlq", reason=reason, dlq=self.DLQ_KEY)
        except Exception as e:
            logger.error("dlq_push_failed", error=str(e))

    async def get_queue_length(self) -> int:
        """Returns the current length of the main payload queue."""
        return await self.redis_client.llen(self.QUEUE_KEY)

    async def get_dlq_length(self) -> int:
        """Returns the current length of the dead-letter queue."""
        return await self.redis_client.llen(self.DLQ_KEY)

    async def close(self) -> None:
        await self.redis_client.close()
