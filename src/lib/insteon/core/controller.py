import serial
import time
from typing import Tuple

DeviceID = Tuple[int, int, int]


class InsteonController:

    def __init__(self, serial_port: str):
        self.ser = serial.Serial(serial_port, 19200, timeout=1)

    def turn_on(self, device: DeviceID, level: int = 0xFF):
        packet = bytes([0x02, 0x62, *device, 0x0F, 0x11, level])
        self._send(packet)

    def turn_off(self, device: DeviceID):
        packet = bytes([0x02, 0x62, *device, 0x0F, 0x13, 0x00])
        self._send(packet)

    def beep(self, device: DeviceID):
        packet = bytes([0x02, 0x62, *device, 0x0F, 0x30, 0x00])
        self._send(packet)

    def _send(self, packet: bytes):
        self.ser.write(packet)
        self.ser.flush()
        time.sleep(0.1)
