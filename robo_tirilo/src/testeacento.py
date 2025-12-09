# -*- coding: utf-8 -*-
import time
import sys
import os

# CONFIGURAÇÃO DE ENCODING FORÇADA PARA SAÍDA DO TERMINAL
# Isso garante que 'print' não tente converter para ASCII se o terminal for burro
import codecs
if sys.stdout.encoding != 'utf-8':
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Adiciona o diretório atual
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from hardware import HardwareController
    print("Módulo Hardware importado.")
except ImportError as e:
    print(f"Erro Hardware: {e}")
    sys.exit(1)

def run_test():
    # VERSÃO REVERTIDA PARA TESTE DE COPIA MANUAL (PUTTY/NANO)
    
    frase_nao = "Ah não"
    frase_parabens = "Parabéns"
    
    print(f"Texto no Código: {frase_nao}")
    print(f"Texto no Código: {frase_parabens}")
    
    hw = HardwareController()
    
    print(f"\n[FALANDO] {frase_nao}")
    hw.speak_animated(frase_nao)
    time.sleep(3)
    
    print(f"\n[FALANDO] {frase_parabens}")
    hw.speak_animated(frase_parabens)
    time.sleep(3)

if __name__ == "__main__":
    run_test()
