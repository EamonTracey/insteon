import json
from typing import Literal

from fastmcp import FastMCP

from ..core.configuration import InsteonConfiguration
from ..core.controller import InsteonController


class InsteonMcp:

    def __init__(self,
                 config: InsteonConfiguration,
                 serial_port: str,
                 transport: Literal["stdio", "http", "sse",
                                    "streamable-http"] = "sse",
                 host: str = "localhost",
                 port: int = 8000):
        self._transport = transport
        self._host = host
        self._port = port

        controller = InsteonController(serial_port)

        self._server = FastMCP("Eamon Insteon")

        @self._server.resource("insteon://devices")
        def devices() -> str:
            """JSON list of controllable Insteon device names."""
            return json.dumps(sorted(config.list_devices()))

        @self._server.tool()
        def turn_on(device: str, level: int = 0xFF) -> str:
            """Turn on a device at the given brightness level (0–255).

            A level of 0 turns the device completely off.
            A level of 127 turns the device on halfway.
            A level of 255 turns the device completely on.
            """
            controller.turn_on(config.get(device), level)
            return f"Turned on {device}"

        @self._server.tool()
        def turn_off(device: str) -> str:
            """Turn off a device.

            This is equivalent to turn_on with level=0.
            """
            controller.turn_off(config.get(device))
            return f"Turned off {device}"

        @self._server.tool()
        def beep(device: str) -> str:
            """Beep a device.

            This causes the device to make a short beeping sound once.
            """
            controller.beep(config.get(device))
            return f"Beeped {device}"

    def run(self):
        self._server.run(transport=self._transport,
                         host=self._host,
                         port=self._port)
