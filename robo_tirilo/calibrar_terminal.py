#!/usr/bin/env python3
import os
import json
import time
import sys

# Tenta carregar o Hardware
try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16)
    HARDWARE_DISPONIVEL = True
except Exception as e:
    print(f"Aviso: Hardware PCA9685 não detectado: {e}")
    HARDWARE_DISPONIVEL = False

ARQUIVO_CONFIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config_olhos.json")

def carregar_config():
    if os.path.exists(ARQUIVO_CONFIG):
        with open(ARQUIVO_CONFIG, 'r') as f:
            return json.load(f)
    return {
        "olho_direito": {
            "vertical": {"porta": 0, "min": 0, "max": 180, "centro": 90},
            "horizontal": {"porta": 1, "min": 0, "max": 180, "centro": 90},
            "palpebra_cima": {"porta": 2, "min": 0, "max": 180, "centro": 90},
            "palpebra_baixo": {"porta": 3, "min": 0, "max": 180, "centro": 90},
            "boca": {"porta": 8, "min": 0, "max": 180, "centro": 90}
        },
        "olho_esquerdo": {
            "vertical": {"porta": 4, "min": 0, "max": 180, "centro": 90},
            "horizontal": {"porta": 5, "min": 0, "max": 180, "centro": 90},
            "palpebra_cima": {"porta": 6, "min": 0, "max": 180, "centro": 90},
            "palpebra_baixo": {"porta": 7, "min": 0, "max": 180, "centro": 90},
            "boca": {"porta": -1, "min": 0, "max": 180, "centro": 90}
        }
    }

def salvar_config(dados):
    with open(ARQUIVO_CONFIG, 'w') as f:
        json.dump(dados, f, indent=4)

configuracao = carregar_config()

def aplicar_angulo(porta, angulo):
    if HARDWARE_DISPONIVEL and porta >= 0:
        angulo = max(0, min(180, angulo))
        try:
            kit.servo[porta].angle = angulo
        except: pass

def menu():
    mecanismos = ["vertical", "horizontal", "palpebra_cima", "palpebra_baixo", "boca"]
    olho = "olho_direito"
    mec_idx = 0
    
    while True:
        os.system('clear')
        mec_nome = mecanismos[mec_idx]
        item = configuracao[olho][mec_nome]
        
        print("=== CALIBRADOR TERMINAL - ROBÔ TIRILO ===")
        print(f"Olho Selecionado: {olho.upper()}")
        print(f"Mecanismo: {mec_nome.upper()} (Porta: {item['porta']})")
        print("-" * 40)
        print(f"Valores Atuais: MIN={item['min']} | CEN={item['centro']} | MAX={item['max']}")
        print("-" * 40)
        print("Comandos:")
        print("  [w/s] Trocar Olho (Direito/Esquerdo)")
        print("  [a/d] Trocar Mecanismo")
        print("  [j] Diminuir Angulo (-5) | [l] Aumentar Angulo (+5)")
        print("  [u] Diminuir Angulo (-1) | [i] Aumentar Angulo (+1)")
        print("  [1] Salvar como MIN")
        print("  [2] Salvar como CENTRO")
        print("  [3] Salvar como MAX")
        print("  [t] Testar Movimento (MIN -> MAX -> CEN)")
        print("  [q] Sair")
        print("-" * 40)
        
        porta = item['porta']
        
        import tty, termios
        def getch():
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(sys.stdin.fileno())
                ch = sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            return ch

        cmd = getch().lower()
        
        if cmd == 'q': break
        elif cmd == 'w' or cmd == 's':
            olho = "olho_esquerdo" if olho == "olho_direito" else "olho_direito"
        elif cmd == 'd': mec_idx = (mec_idx + 1) % len(mecanismos)
        elif cmd == 'a': mec_idx = (mec_idx - 1) % len(mecanismos)
        elif cmd == 'j': aplicar_angulo(porta, kit.servo[porta].angle - 5 if HARDWARE_DISPONIVEL else 90)
        elif cmd == 'l': aplicar_angulo(porta, kit.servo[porta].angle + 5 if HARDWARE_DISPONIVEL else 90)
        elif cmd == 'u': aplicar_angulo(porta, kit.servo[porta].angle - 1 if HARDWARE_DISPONIVEL else 90)
        elif cmd == 'i': aplicar_angulo(porta, kit.servo[porta].angle + 1 if HARDWARE_DISPONIVEL else 90)
        elif cmd == '1': 
            configuracao[olho][mec_nome]['min'] = int(kit.servo[porta].angle)
            salvar_config(configuracao)
        elif cmd == '2': 
            configuracao[olho][mec_nome]['centro'] = int(kit.servo[porta].angle)
            salvar_config(configuracao)
        elif cmd == '3': 
            configuracao[olho][mec_nome]['max'] = int(kit.servo[porta].angle)
            salvar_config(configuracao)
        elif cmd == 't':
            print("\nTestando...")
            aplicar_angulo(porta, item['min'])
            time.sleep(1)
            aplicar_angulo(porta, item['max'])
            time.sleep(1)
            aplicar_angulo(porta, item['centro'])

if __name__ == "__main__":
    menu()
