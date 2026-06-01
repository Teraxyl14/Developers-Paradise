"""Terminate old workflow and start fresh."""
import asyncio
from temporalio.client import Client

async def main():
    client = await Client.connect("localhost:7233")
    
    # Terminate old broken workflow
    try:
        handle = client.get_workflow_handle("extraction-scheduler-master")
        await handle.terminate("Restarting with fixed code")
        print("Old workflow terminated")
    except Exception as e:
        print(f"No existing workflow to terminate: {e}")
    
    # Also terminate any child workflows that may exist
    for name in ["extraction-g2-devops", "extraction-discourse-rust"]:
        try:
            handle = client.get_workflow_handle(name)
            await handle.terminate("Cleanup")
            print(f"Terminated child: {name}")
        except Exception:
            pass

    print("Ready to restart")

if __name__ == "__main__":
    asyncio.run(main())
