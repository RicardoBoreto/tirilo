#!/usr/bin/env python3
"""
teste_movimentos.py — Testa movimentos do Tirilo via texto.
Uso: python3 ferramentas/teste_movimentos.py
"""
import os, sys, time

PASTA_FERRAMENTA = os.path.dirname(os.path.abspath(__file__))
PASTA_ROBO       = os.path.dirname(PASTA_FERRAMENTA)
sys.path.insert(0, PASTA_ROBO)

from olhos_tirilo import ControladorOlhos

COMANDOS = """
Comandos disponíveis:
  piscar / pisca                  → pisca os dois olhos
  piscar olho direito             → pisca só o olho direito
  piscar olho esquerdo            → pisca só o olho esquerdo
  abra a boca / abre boca         → abre a boca
  fecha a boca / fecha boca       → fecha a boca
  olhe para direita / direita     → olha para a direita
  olhe para esquerda / esquerda   → olha para a esquerda
  olhe para cima / cima           → olha para cima
  olhe para baixo / baixo         → olha para baixo
  olhe para mim / neutro / frente → posição neutra
  fique vesgo / vesgo             → fica vesgo
  fica triste / triste            → expressão triste
  surpresa / assustado            → expressão de surpresa
  acorde / acordar                → animação de acordar
  durma / dormir                  → animação de dormir
  galope / galopa                 → galope (olho alternado)
  sair / q                        → encerra
"""

def executar(cmd, olhos):
    c = cmd.strip().lower()

    if any(x in c for x in ["piscar olho direito", "pisca olho direito", "pisca direito", "olho direito pisca"]):
        print("[Movimento] Piscar olho direito")
        olhos.piscar_aleatorio("olho_direito")

    elif any(x in c for x in ["piscar olho esquerdo", "pisca olho esquerdo", "pisca esquerdo", "olho esquerdo pisca"]):
        print("[Movimento] Piscar olho esquerdo")
        olhos.piscar_aleatorio("olho_esquerdo")

    elif any(x in c for x in ["piscar", "pisca"]):
        print("[Movimento] Piscar ambos")
        olhos.piscar()

    elif any(x in c for x in ["abra a boca", "abre a boca", "abre boca", "abrir boca"]):
        print("[Movimento] Abre boca")
        olhos.mover_boca(100)

    elif any(x in c for x in ["fecha a boca", "fecha boca", "fechar boca"]):
        print("[Movimento] Fecha boca")
        olhos.mover_boca(0)

    elif any(x in c for x in ["olhe para direita", "olha direita", "direita"]):
        print("[Movimento] Olha direita")
        olhos.mover_suave_ambos(h_alvo=0, v_alvo=50, duracao=0.4)

    elif any(x in c for x in ["olhe para esquerda", "olha esquerda", "esquerda"]):
        print("[Movimento] Olha esquerda")
        olhos.mover_suave_ambos(h_alvo=100, v_alvo=50, duracao=0.4)

    elif any(x in c for x in ["olhe para cima", "olha cima", "cima"]):
        print("[Movimento] Olha cima")
        olhos.olhar_cima()

    elif any(x in c for x in ["olhe para baixo", "olha baixo", "baixo"]):
        print("[Movimento] Olha baixo")
        olhos.mover_suave_ambos(h_alvo=50, v_alvo=90, duracao=0.4)

    elif any(x in c for x in ["olhe para mim", "olha para mim", "neutro", "frente", "normal"]):
        print("[Movimento] Neutro / olha para mim")
        olhos.olhar_neutro()

    elif any(x in c for x in ["fique vesgo", "fica vesgo", "vesgo"]):
        print("[Movimento] Vesgo")
        olhos.olhar_vesgo()
        time.sleep(1.5)
        olhos.olhar_neutro(suave=True)

    elif any(x in c for x in ["fica triste", "fique triste", "triste"]):
        print("[Movimento] Triste")
        olhos.olhar_triste()

    elif any(x in c for x in ["surpresa", "surpreso", "assustado"]):
        print("[Movimento] Surpresa")
        olhos.surpresa()

    elif any(x in c for x in ["acorde", "acordar"]):
        print("[Movimento] Acordar")
        olhos.animacao_acordar()

    elif any(x in c for x in ["durma", "dormir"]):
        print("[Movimento] Dormir")
        olhos.animacao_dormir()

    elif any(x in c for x in ["galope", "galopa"]):
        print("[Movimento] Galope")
        olhos.alternar_piscar(batidas=4, vel=0.15)

    else:
        print(f"Comando não reconhecido: '{cmd}'")
        print("Digite 'ajuda' para ver os comandos disponíveis.")


def main():
    print("=== Teste de Movimentos do Tirilo ===")
    try:
        olhos = ControladorOlhos()
        olhos.olhar_neutro()
        print("Hardware PCA9685 pronto.\n")
    except Exception as e:
        print(f"ERRO ao iniciar hardware: {e}")
        sys.exit(1)

    print(COMANDOS)

    while True:
        try:
            cmd = input(">> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nEncerrando.")
            break

        if not cmd:
            continue
        if cmd.lower() in ("sair", "q", "exit"):
            print("Encerrando.")
            break
        if cmd.lower() in ("ajuda", "help", "?"):
            print(COMANDOS)
            continue

        executar(cmd, olhos)

    olhos.olhar_neutro()
    olhos.mover_boca(0)

if __name__ == "__main__":
    main()
