import asyncio
import click

from insteon import InsteonAgent


@click.command()
@click.argument("prompt")
@click.option("--ollama-url", default="http://localhost:11434")
@click.option("--mcp-url", default="http://localhost:8000/sse")
@click.option("--model", default="gemma4")
def main(prompt: str, ollama_url: str, mcp_url: str, model: str):
    asyncio.run(run(ollama_url, mcp_url, model, prompt))


async def run(ollama_url: str, mcp_url: str, model: str, prompt: str):
    async with InsteonAgent(ollama_url, mcp_url, model) as agent:
        await agent.execute(prompt)


if __name__ == "__main__":
    main()
