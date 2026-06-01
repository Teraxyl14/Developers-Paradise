import asyncio
from temporalio.client import Client

async def main():
    try:
        client = await Client.connect('localhost:7233')
        handle = client.get_workflow_handle('extraction-scheduler-master')
        desc = await handle.describe()
        print(f'Workflow status: {desc.status}')
        
        # Also let's check the extraction workflow for Discord
        try:
            h2 = client.get_workflow_handle('extraction-discord-rust')
            desc2 = await h2.describe()
            print(f'Discord workflow status: {desc2.status}')
        except Exception as e2:
            print(f'Discord workflow error: {e2}')
            
        # And G2
        try:
            h3 = client.get_workflow_handle('extraction-g2-devops')
            desc3 = await h3.describe()
            print(f'G2 workflow status: {desc3.status}')
        except Exception as e3:
            print(f'G2 workflow error: {e3}')
            
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(main())
