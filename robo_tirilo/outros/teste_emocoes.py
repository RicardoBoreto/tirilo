#!/usr/bin/env python3
import time
import os
import sys

# Garante que ele ache a classe olhos_tirilo no mesmo diretório
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from olhos_tirilo import ControladorOlhos
except ImportError:
    print("ERRO: Arquivo olhos_tirilo.py não encontrado no diretório!")
    sys.exit(1)


def menu():
    print("="*40)
    print("    TESTE DE EMOÇÕES - ROBÔ TIRILO    ")
    print("="*40)
    print("1 - Olhar Neutro (Normal)")
    print("2 - Abrir Olhos Muito (Assustado/Surpreso)")
    print("3 - Fechar Olhos (Dormindo)")
    print("4 - Olhar Triste")
    print("5 - Olhar Desconfiado (Canto)")
    print("6 - Olhar Feliz (Sorriso)")
    print("7 - Piscar!")
    print("8 - Animação: Acordar")
    print("9 - Animação: Dormir")
    print("="*40)
    print("X - Controle Manual de Pálpebras (0 a 100%)")
    print("0 - Sair")
    print("="*40)


if __name__ == "__main__":
    t = ControladorOlhos()
    
    # Valida se achou o json
    if not t.config:
        print("!! AVISO: Configure os motores no calibrador_olhos.py e salve o json primeiro !!")
        sys.exit(1)

    while True:
        menu()
        escolha = input("Digite o número da emoção: ").strip().lower()

        if escolha == '0':
            print("Saindo...")
            break
        elif escolha == '1':
            t.olhar_neutro()
        elif escolha == '2':
            t.surpresa()
        elif escolha == '3':
            t.fechar_olhos()
        elif escolha == '4':
            t.olhar_triste()
        elif escolha == '5':
            t.desconfiado()
        elif escolha == '6':
            t.olhar_feliz()
        elif escolha == '7':
            t.piscar()
        elif escolha == '8':
            t.animacao_acordar()
        elif escolha == '9':
            t.animacao_dormir()
        elif escolha == 'x':
            pct = input("Digite a porcentagem de FECHAMENTO das pálpebras (0=Aberto, 100=Fechado): ")
            try:
                val = float(pct)
                t.aplicar_em_ambos(t.fechar_palpebra, val)
                print(f"Pálpebras enviadas para {val}% de fechamento.")
            except ValueError:
                print("Valor inválido.")
        else:
            print("Comando não reconhecido.")
            
        time.sleep(1)
        print("\n\n")
