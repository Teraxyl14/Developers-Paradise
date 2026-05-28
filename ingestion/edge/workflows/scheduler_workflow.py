from datetime import timedelta
from typing import List

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from ingestion.edge.config.targets import TargetConfig
    from ingestion.edge.workflows.extraction_workflow import ExtractionWorkflow


@workflow.defn
class SchedulerWorkflow:
    """
    Entity Workflow pattern: Runs continuously, manages child ExtractionWorkflows.
    """
    def __init__(self):
        self.targets: List[TargetConfig] = []
        self.iteration_count = 0
        
    @workflow.signal
    def add_target(self, config: TargetConfig):
        self.targets.append(config)
        
    @workflow.run
    async def run(self, initial_targets: List[TargetConfig]) -> None:
        if not self.targets:
            self.targets = initial_targets
            
        # Spawn child workflows for each target
        for idx, target in enumerate(self.targets):
            workflow_id = f"extraction-{target.name.lower().replace(' ', '-')}"
            
            # Start child workflow without blocking (it runs indefinitely)
            await workflow.start_child_workflow(
                ExtractionWorkflow.run,
                args=[target],
                id=workflow_id,
                parent_close_policy=workflow.ParentClosePolicy.ABANDON, # Let children run if scheduler restarts
                workflow_execution_timeout=timedelta(days=365)
            )
            
        self.iteration_count += 1
        
        # After a week, ContinueAsNew to prevent event history bloat
        await workflow.sleep(timedelta(days=7))
        workflow.continue_as_new(self.targets)
