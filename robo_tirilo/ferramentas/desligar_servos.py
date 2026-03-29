#!/usr/bin/env python3
"""
desligar_servos.py — Desativa todos os servos do PCA9685.
Elimina ruídos e movimentos involuntários quando o robô está em repouso.
Uso: python3 ferramentas/desligar_servos.py
"""
import sys

try:
    from adafruit_servokit import ServoKit
except ImportError:
    print("ERRO: adafruit_servokit não encontrado.")
    sys.exit(1)

def desligar_todos():
    print("Iniciando PCA9685...")
    try:
        kit = ServoKit(channels=16)
    except Exception as e:
        print(f"ERRO ao iniciar PCA9685: {e}")
        sys.exit(1)

    print("Desativando todos os 16 canais de servo...")
    for i in range(16):
        try:
            kit._pca.channels[i].duty_cycle = 0
        except Exception as e:
            print(f"  Canal {i}: erro ({e})")

    print("Todos os servos desativados. O robô está em repouso.")

if __name__ == "__main__":
    desligar_todos()
