import asyncio
import structlog
from temporalio.client import Client

from ingestion.edge.config.settings import settings
from ingestion.edge.config.targets import TargetConfig
from ingestion.edge.workflows.scheduler_workflow import SchedulerWorkflow

logger = structlog.get_logger(__name__)

# Sample targets to bootstrap the scheduler
INITIAL_TARGETS = [
    TargetConfig(
        name="G2 DevOps",
        target_type="g2",
        urls=["https://www.g2.com/categories/devops"],
        waf_type="datadome",
        interval_minutes=1440 # Daily
    ),
    TargetConfig(
        name="Discourse Rust",
        target_type="discourse",
        urls=["https://users.rust-lang.org"],
        waf_type="none",
        interval_minutes=60
    )
]

async def main():
    logger.info("Connecting to Temporal server...", host=settings.temporal_host)
    
    client = await Client.connect(
        settings.temporal_host,
        namespace=settings.temporal_namespace
    )
    
    logger.info("Triggering Scheduler Workflow...")
    
    # We start the scheduler workflow, which will spawn the children
    handle = await client.start_workflow(
        SchedulerWorkflow.run,
        args=[INITIAL_TARGETS],
        id="extraction-scheduler-master",
        task_queue="extraction-task-queue"
    )
    
    logger.info(f"Scheduler workflow started with ID: {handle.id}")
    logger.info("Run 'python -m ingestion.edge.worker' to execute tasks.")

if __name__ == "__main__":
    asyncio.run(main())
