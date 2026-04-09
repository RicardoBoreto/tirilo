#!/usr/bin/env python3
import os
import time

def main():
    print("[SISTEMA] Reiniciando o Robô Tirilo em 3 segundos...")
    time.sleep(3)
    os.system("sudo reboot")

if __name__ == "__main__":
    main()
