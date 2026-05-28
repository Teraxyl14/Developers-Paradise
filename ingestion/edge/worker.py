import asyncio
import structlog
from temporalio.client import Client
from temporalio.worker import Worker

from ingestion.edge.config.settings import settings
from ingestion.edge.activities.extraction_activities import icebreaker_activity, extract_activity
from ingestion.edge.activities.queue_activities import queue_activity
from ingestion.edge.workflows.extraction_workflow import ExtractionWorkflow
from ingestion.edge.workflows.scheduler_workflow import SchedulerWorkflow

logger = structlog.get_logger(__name__)

async def main():
    logger.info("Connecting to Temporal server...", host=settings.temporal_host)
    
    client = await Client.connect(
        settings.temporal_host,
        namespace=settings.temporal_namespace
    )
    
    worker = Worker(
        client,
        task_queue="extraction-task-queue",
        workflows=[ExtractionWorkflow, SchedulerWorkflow],
        activities=[icebreaker_activity, extract_activity, queue_activity],
        max_concurrent_activities=10
    )
    
    logger.info("Starting Temporal Worker...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
