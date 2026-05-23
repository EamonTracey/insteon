import json
from typing import Literal

import click

from insteon import InsteonConfiguration, InsteonMcp


@click.command()
@click.option("-c",
              "--config",
              default="data/falmouth.json",
              type=click.Path(exists=True))
@click.option("-s", "--serial-port", default="/dev/cu.usbserial-AM00O1SH")
@click.option("--transport",
              default="sse",
              type=click.Choice(["stdio", "http", "sse", "streamable-http"]))
@click.option("--server-host", default="localhost")
@click.option("--server-port", default=8000)
def main(config: str, serial_port: str,
         transport: Literal["stdio", "http", "sse", "streamable-http"],
         server_host: str, server_port: int):
    config = load_config(config)
    server = InsteonMcp(config,
                        serial_port,
                        transport=transport,
                        server_host=server_host,
                        server_port=server_port)
    server.run()


def load_config(config_path: str) -> InsteonConfiguration:
    with open(config_path, "r") as fp:
        return InsteonConfiguration.from_json(json.load(fp))


if __name__ == "__main__":
    main()
