import asyncio
import click
from insteon import InsteonAgent


@click.command()
@click.argument("prompt")
@click.option("--mcp-server-url", default="http://127.0.0.1:8000/sse")
@click.option("--model", default="gemma4")
def main(prompt: str, mcp_server_url: str, model: str):
    asyncio.run(run(mcp_server_url, model, prompt))


async def run(mcp_server_url: str, model: str, prompt: str):
    async with InsteonAgent(mcp_server_url, model) as agent:
        await agent.execute(prompt)


if __name__ == "__main__":
    main()
