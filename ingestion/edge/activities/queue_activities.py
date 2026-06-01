import datetime
from typing import List, Dict, Any
from temporalio import activity

from ingestion.edge.broker.redis_broker import RedisBroker


@activity.defn
async def queue_activity(payloads: List[Dict[str, Any]]) -> None:
    """
    Pushes extracted payloads to the Redis queue.
    
    Adds extraction metadata (queued_at timestamp) to each payload
    before queueing to ensure traceability.
    """
    if not payloads:
        return

    # Enrich each payload with queue-time metadata
    enriched = []
    for payload in payloads:
        payload["queued_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        # Ensure required fields exist
        if "source" not in payload:
            payload["source"] = "unknown"
        if "extracted_at" not in payload:
            payload["extracted_at"] = payload["queued_at"]
        enriched.append(payload)

    broker = RedisBroker()
    try:
        await broker.push_batch(enriched)
    finally:
        await broker.close()
