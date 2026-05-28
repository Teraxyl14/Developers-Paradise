from datetime import timedelta
import uuid
from typing import Optional

from temporalio import workflow
from temporalio.exceptions import ApplicationError

# Import activities
with workflow.unsafe.imports_passed_through():
    from ingestion.edge.activities.extraction_activities import icebreaker_activity, extract_activity
    from ingestion.edge.activities.queue_activities import queue_activity
    from ingestion.edge.config.targets import TargetConfig
    from ingestion.edge.evasion.icebreaker import SessionContext


@workflow.defn
class ExtractionWorkflow:
    def __init__(self):
        self.target_config: Optional[TargetConfig] = None
        self.pagination_state: dict = {}
        self.is_paused = False
        self.captcha_resolved_ctx: Optional[SessionContext] = None

    @workflow.signal
    def captcha_solved(self, new_ctx: SessionContext):
        """Signal received from HITL operator when CAPTCHA is solved."""
        self.captcha_resolved_ctx = new_ctx
        self.is_paused = False
        
    @workflow.signal
    def pause(self):
        self.is_paused = True
        
    @workflow.signal
    def resume(self):
        self.is_paused = False

    @workflow.run
    async def run(self, config: TargetConfig) -> None:
        self.target_config = config
        workflow_id = workflow.info().workflow_id
        
        while True:
            # Wait if paused by operator
            await workflow.wait_condition(lambda: not self.is_paused)

            session_ctx = None
            
            # Stage 1: Icebreaker (if WAF is present)
            if config.waf_type in ["cloudflare", "datadome", "akamai"]:
                try:
                    # We pass the workflow ID as the session ID to maintain proxy stickiness
                    session_ctx = await workflow.execute_activity(
                        icebreaker_activity,
                        args=[workflow_id, config.urls[0]],
                        start_to_close_timeout=timedelta(minutes=2),
                        retry_policy=workflow.RetryPolicy(maximum_attempts=2)
                    )
                except Exception as e:
                    # Extract original error if wrapped by ApplicationError
                    err_type = getattr(e, "type", "")
                    if "CaptchaRequiredError" in err_type or "CaptchaRequiredError" in str(e):
                        # Trigger HITL fallback
                        self.is_paused = True
                        workflow.logger.warn(f"CAPTCHA detected for {config.name}. Waiting for 'captcha_solved' signal.")
                        # Wait for human to send the signal with the new context
                        await workflow.wait_condition(lambda: self.captcha_resolved_ctx is not None)
                        session_ctx = self.captcha_resolved_ctx
                        self.captcha_resolved_ctx = None
                        self.is_paused = False
                    else:
                        raise e

            # We process pages up to config.max_pages per cycle
            pages_processed = 0
            
            while pages_processed < config.max_pages:
                # Stage 2: Extraction
                try:
                    payloads, next_state = await workflow.execute_activity(
                        extract_activity,
                        args=[session_ctx, config, self.pagination_state],
                        start_to_close_timeout=timedelta(minutes=1),
                        retry_policy=workflow.RetryPolicy(maximum_attempts=1) # Don't retry automatically on 429
                    )
                    
                    self.pagination_state = next_state
                    
                    if payloads:
                        # Stage 3: Queue to Redis
                        await workflow.execute_activity(
                            queue_activity,
                            args=[payloads],
                            start_to_close_timeout=timedelta(seconds=30),
                            retry_policy=workflow.RetryPolicy(
                                initial_interval=timedelta(seconds=1),
                                maximum_interval=timedelta(minutes=1),
                                maximum_attempts=5
                            )
                        )
                        
                    # Break loop if pagination reset (no more data)
                    if (config.target_type == "discourse" and next_state.get("page") == 0) or \
                       (config.target_type == "discord" and next_state.get("before") is None):
                         break
                         
                    pages_processed += 1
                    
                except ApplicationError as e:
                    if "RateLimitError" in e.type:
                        # Parse retry_after from the error message (or pass it in details)
                        # We assume the error message ends with "Retry after X.0s"
                        retry_after = 60.0
                        msg_parts = e.message.split("Retry after ")
                        if len(msg_parts) > 1:
                            try:
                                retry_after = float(msg_parts[1].replace("s", ""))
                            except ValueError:
                                pass
                                
                        workflow.logger.info(f"Rate limited. Sleeping for {retry_after}s.")
                        await workflow.sleep(retry_after)
                        continue # Retry the extraction
                        
                    elif "AuthError" in e.type:
                        workflow.logger.error(f"Authentication failed: {e.message}")
                        return # Abort this target
                        
                    elif "SessionExpiredError" in e.type or "SilentBlockError" in e.type:
                        workflow.logger.warn("Session expired or silent block. Breaking page loop to restart Icebreaker.")
                        break # Break inner loop, next cycle will run icebreaker again
                        
                    else:
                        raise e
            
            # Wait for next extraction cycle
            await workflow.sleep(timedelta(minutes=config.interval_minutes))
