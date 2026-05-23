from dataclasses import dataclass, field
from typing import Dict, Tuple

DeviceID = Tuple[int, int, int]


@dataclass
class InsteonConfiguration:
    devices: Dict[str, DeviceID] = field(default_factory=dict)

    def get(self, name: str) -> DeviceID:
        return self.devices[name]

    def list_devices(self):
        return list(self.devices.keys())

    @classmethod
    def from_json(cls, data: dict):
        config = cls()
        for name, device_id in data.get("devices").items():
            config._add_device(name, device_id)
        return config

    def to_json(self):
        return {
            "devices": {
                name: self._format_id(device_id)
                for name, device_id in self.devices.items()
            }
        }

    def _add_device(self, name: str, device_id: str):
        self.devices[name] = self._parse_id(device_id)

    @staticmethod
    def _parse_id(device_id: str) -> DeviceID:
        return tuple(int(byte, 16) for byte in device_id.split("."))

    @staticmethod
    def _format_id(device_id: DeviceID) -> str:
        return ".".join(f"{byte:02X}" for byte in device_id)
