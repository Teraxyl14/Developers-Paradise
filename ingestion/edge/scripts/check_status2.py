import asyncio
from temporalio.client import Client
from temporalio.client import WorkflowFailureError

async def main():
    try:
        client = await Client.connect('localhost:7233')
        
        # Check Scheduler
        try:
            h = client.get_workflow_handle('extraction-scheduler-master')
            desc = await h.describe()
            print(f'Scheduler status: {desc.status}')
        except Exception as e:
            print(f'Scheduler error: {e}')
            
        # Check G2
        try:
            h3 = client.get_workflow_handle('extraction-g2-devops')
            desc3 = await h3.describe()
            print(f'G2 status: {desc3.status}')
            
            if desc3.status == 3: # FAILED
                try:
                    await h3.result()
                except WorkflowFailureError as e:
                    print(f'G2 Failure Reason: {e.cause}')
        except Exception as e3:
            print(f'G2 workflow check error: {e3}')
            
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(main())
