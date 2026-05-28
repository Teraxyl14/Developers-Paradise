from datetime import timedelta
from typing import List, Dict, Any

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from ingestion.edge.config.targets import TargetConfig
    from ingestion.edge.workflows.extraction_workflow import ExtractionWorkflow


@workflow.defn
class SchedulerWorkflow:
    """
    Entity Workflow pattern: Runs continuously, manages child ExtractionWorkflows.
    
    Signals:
        - add_target: Adds a new target and spawns its extraction workflow
        - remove_target: Removes a target by name (child workflow will be terminated)
        - pause_target: Sends a pause signal to a running child workflow
        - resume_target: Sends a resume signal to a paused child workflow
    
    Queries:
        - get_status: Returns the current state of all managed targets
    """

    def __init__(self):
        self.targets: List[TargetConfig] = []
        self.active_workflows: Dict[str, str] = {}  # name -> workflow_id
        self.paused_targets: set = set()
        self.iteration_count = 0

    @workflow.signal
    async def add_target(self, config: TargetConfig):
        """Adds a new target and spawns its child ExtractionWorkflow."""
        self.targets.append(config)
        wf_id = f"extraction-{config.name.lower().replace(' ', '-')}"
        self.active_workflows[config.name] = wf_id

        await workflow.start_child_workflow(
            ExtractionWorkflow.run,
            args=[config],
            id=wf_id,
            parent_close_policy=workflow.ParentClosePolicy.ABANDON,
            workflow_execution_timeout=timedelta(days=365)
        )

    @workflow.signal
    def remove_target(self, target_name: str):
        """Removes a target by name. The child workflow will be cancelled."""
        self.targets = [t for t in self.targets if t.name != target_name]
        if target_name in self.active_workflows:
            del self.active_workflows[target_name]
        self.paused_targets.discard(target_name)

    @workflow.signal
    def pause_target(self, target_name: str):
        """Marks a target as paused. The child workflow should check pause state."""
        self.paused_targets.add(target_name)

    @workflow.signal
    def resume_target(self, target_name: str):
        """Marks a target as resumed."""
        self.paused_targets.discard(target_name)

    @workflow.query
    def get_status(self) -> Dict[str, Any]:
        """Returns the current state of all managed targets and workflows."""
        return {
            "iteration": self.iteration_count,
            "total_targets": len(self.targets),
            "active_workflows": dict(self.active_workflows),
            "paused_targets": list(self.paused_targets),
            "targets": [
                {
                    "name": t.name,
                    "type": t.target_type,
                    "waf": t.waf_type,
                    "interval_minutes": t.interval_minutes,
                    "workflow_id": self.active_workflows.get(t.name, "unknown"),
                    "paused": t.name in self.paused_targets
                }
                for t in self.targets
            ]
        }

    @workflow.run
    async def run(self, initial_targets: List[TargetConfig]) -> None:
        if not self.targets:
            self.targets = initial_targets

        # Spawn child workflows for each initial target
        for target in self.targets:
            wf_id = f"extraction-{target.name.lower().replace(' ', '-')}"
            self.active_workflows[target.name] = wf_id

            await workflow.start_child_workflow(
                ExtractionWorkflow.run,
                args=[target],
                id=wf_id,
                parent_close_policy=workflow.ParentClosePolicy.ABANDON,
                workflow_execution_timeout=timedelta(days=365)
            )

        self.iteration_count += 1

        # After a week, ContinueAsNew to prevent event history bloat
        await workflow.sleep(timedelta(days=7))
        workflow.continue_as_new(self.targets)
