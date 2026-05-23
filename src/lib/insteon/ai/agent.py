import asyncio
import json

import fastmcp
import ollama

SYSTEM_PROMPT = """You are a home automation controller. Your only job is to call tools to control devices.

RULES:
1. You must call 0 or more tools. Never respond with text.
2. Only use device names from the AVAILABLE DEVICES list. Never invent or guess names.
3. Match the user's intent to the most relevant devices. If they say "family room", only control family room devices.
4. If the user says "all" or "everything" with no location, call the tool for every device on the list.
5. If the user is not giving a home automation command, do NOT call any tool.
6. If no devices clearly match, do NOT call any tool.
7. Greetings, questions, and conversation are NOT commands. Do nothing.

AVAILABLE DEVICES:
{devices}

EXAMPLES:
- "turn on the family room lights" → call turn_on for every device with "family_room" in the name
- "turn everything off" → call turn_off for every device
- "turn off all the lights upstairs" → call turn_off for every device with "upstairs" in the name
- "turn on the garage" → do nothing, no such device
"""


class InsteonAgent:

    def __init__(self, ollama_url: str, mcp_url: str, model: str):
        self._ollama_url = ollama_url
        self._mcp_url = mcp_url
        self._model = model

        self._ollama = None
        self._mcp = None
        self._ollama_tools = None
        self._system_prompt = None

    async def __aenter__(self):
        self._mcp = fastmcp.Client(self._mcp_url)
        await self._mcp.__aenter__()
        await self._initialize()
        return self

    async def __aexit__(self, *args):
        await self._mcp.__aexit__(*args)

    async def execute(self, prompt: str) -> bool:
        response = self._ollama.chat(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": self._system_prompt
                },
                {
                    "role": "user",
                    "content": prompt
                },
            ],
            tools=self._ollama_tools,
        )

        if response.message.tool_calls:
            await asyncio.gather(*[
                self._mcp.call_tool(
                    tool_call.function.name,
                    tool_call.function.arguments,
                ) for tool_call in response.message.tool_calls
            ])

        return response.message.tool_calls

    async def _initialize(self):
        self._ollama = ollama.Client(host=self._ollama_url)

        # Retrieve the list of devices supported by the server.
        resource = await self._mcp.read_resource("insteon://devices")
        devices = json.loads(resource[0].text)
        devices = "\n".join(f" - {device}" for device in devices)
        self._system_prompt = SYSTEM_PROMPT.format(devices=devices)

        # Retrieve the tools supported by the server.
        mcp_tools = await self._mcp.list_tools()
        self._ollama_tools = [{
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema,
            }
        } for tool in mcp_tools]
