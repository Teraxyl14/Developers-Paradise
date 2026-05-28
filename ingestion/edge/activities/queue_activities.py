from typing import List, Dict, Any
from temporalio import activity

from ingestion.edge.queue.redis_broker import RedisBroker

@activity.defn
async def queue_activity(payloads: List[Dict[str, Any]]) -> None:
    """Pushes extracted payloads to the Redis queue."""
    if not payloads:
        return
        
    broker = RedisBroker()
    try:
        await broker.push_batch(payloads)
    finally:
        await broker.close()
