import json

import click

from insteon_ import InsteonConfiguration, InsteonController

CONFIG_KEY = "config"
CONTROLLER_KEY = "controller"


@click.group()
@click.option("-c",
              "--config",
              default="data/falmouth.json",
              type=click.Path(exists=True))
@click.option("-s", "--serial-port", default="/dev/cu.usbserial-AM00O1SH")
@click.pass_context
def main(ctx: click.Context, config: str, serial_port: str):
    config = load_config(config)
    controller = InsteonController(serial_port)

    ctx.ensure_object(dict)
    ctx.obj[CONFIG_KEY] = config
    ctx.obj[CONTROLLER_KEY] = controller


@main.command(help="Turn on a device.")
@click.argument("device")
@click.option("-l",
              "--level",
              default=255,
              help="Level of brightness in the range [0, 255]")
@click.pass_context
def on(ctx: click.Context, device: str, level: int):
    config = ctx.obj[CONFIG_KEY]
    controller = ctx.obj[CONTROLLER_KEY]

    device_id = config.get(device)
    controller.turn_on(device_id, level)


@main.command(help="Turn off a device.")
@click.argument("device")
@click.pass_context
def off(ctx: click.Context, device: str):
    config = ctx.obj[CONFIG_KEY]
    controller = ctx.obj[CONTROLLER_KEY]

    device_id = config.get(device)
    controller.turn_off(device_id)


@main.command(help="Make a device beep.")
@click.argument("device")
@click.pass_context
def beep(ctx: click.Context, device: str):
    config = ctx.obj[CONFIG_KEY]
    controller = ctx.obj[CONTROLLER_KEY]

    device_id = config.get(device)
    controller.beep(device_id)


def load_config(config_path: str) -> InsteonConfiguration:
    with open(config_path, "r") as fp:
        return InsteonConfiguration.from_json(json.load(fp))


if __name__ == "__main__":
    main()
