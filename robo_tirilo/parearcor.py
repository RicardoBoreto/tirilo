#!/usr/bin/env python3
# parearcor.py – Jogo Parear Cores para Raspberry Pi 5 (KMS/DRM)
# Baseado no jogo original; adaptado para: display KMS, espeak-ng, ControladorOlhos

import pygame
import os
import sys
import random
import threading
import math
import subprocess
import time

PASTA_ROBO = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PASTA_ROBO)

try:
    from olhos_tirilo import ControladorOlhos
except ImportError:
    ControladorOlhos = None

# ============ CONFIGURAÇÃO ============
LARGURA, ALTURA = 800, 480
FPS = 50

CORES_NOME = {
    "vermelho": (220,  50,  50),
    "azul":     ( 50,  80, 220),
    "verde":    ( 50, 180,  50),
    "amarelo":  (220, 200,   0),
    "roxo":     (140,   0, 180),
    "laranja":  (255, 140,   0),
    "rosa":     (240, 100, 160),
    "marrom":   (139,  69,  19),
}

# ============ DISPLAY (KMS/DRM) ============
def iniciar_pygame():
    if "DISPLAY" not in os.environ:
        for driver in ['kmsdrm', 'drm']:
            for index in ['0', '1']:
                try:
                    os.environ["SDL_VIDEODRIVER"] = driver
                    os.environ["SDL_KMSDRM_DEVICE_INDEX"] = index
                    pygame.display.init()
                    break
                except: continue
            if pygame.display.get_init(): break
    pygame.init()
    try:
        info = pygame.display.Info()
        tela = pygame.display.set_mode((info.current_w, info.current_h), pygame.FULLSCREEN)
    except Exception:
        tela = pygame.display.set_mode((LARGURA, ALTURA), pygame.FULLSCREEN)
    pygame.mouse.set_visible(False)
    return tela

# ============ VOZ (espeak-ng) com animação de boca ============
def falar_async(texto, olhos=None):
    def _falar():
        try:
            proc = subprocess.Popen(
                ["espeak-ng", "-v", "pt-br", "-s", "145", "-p", "75", texto],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            if olhos:
                while proc.poll() is None:
                    olhos.mover_boca(random.choice([0, 50, 80, 50, 100]))
                    time.sleep(random.uniform(0.08, 0.16))
                olhos.mover_boca(0)
            else:
                proc.wait()
        except Exception: pass
    threading.Thread(target=_falar, daemon=True).start()

# ============ FOGOS DE ARTIFÍCIO ============
class Particula:
    def __init__(self, x, y, cores):
        self.x = x + random.randint(-40, 40)
        self.y = y + random.randint(-40, 40)
        self.cor = random.choice(cores)
        self.vx = random.uniform(-18, 18)
        self.vy = random.uniform(-28, -6)
        self.vida = random.randint(60, 100)

    def atualizar(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.75
        self.vida -= 1.5

    def desenhar(self, tela):
        if self.vida > 0:
            raio = max(2, int(self.vida / 14))
            pygame.draw.circle(tela, self.cor, (int(self.x), int(self.y)), raio)

# ============ JOGO ============
def main():
    tela = iniciar_pygame()
    W, H = tela.get_width(), tela.get_height()
    clock = pygame.time.Clock()

    # Olhos (reações opcionais)
    olhos = None
    if ControladorOlhos:
        try:
            olhos = ControladorOlhos()
            olhos.olhar_neutro()
        except Exception: pass

    pygame.font.init()
    fonte_instrucao = pygame.font.SysFont("arial", 27, bold=True)
    fonte_placar    = pygame.font.SysFont("arial", 30)

    # Estado global do jogo
    nivel       = [1]
    acertos     = [0]
    cores_usadas = [list(CORES_NOME.items())[:4]]
    particulas  = []
    quadrados   = []
    circulos    = []
    arrastando  = [None]

    COR_LISTA = list(CORES_NOME.values())

    def criar_fogos(cx, cy):
        for _ in range(200):
            particulas.append(Particula(cx, cy, COR_LISTA))

    def novo_round():
        arrastando[0] = None
        # Sobe de nível a cada 6 acertos
        if acertos[0] > 0 and acertos[0] % 6 == 0:
            nivel[0] += 1
            n = min(8, 3 + nivel[0])
            cores_usadas[0] = list(CORES_NOME.items())[:n]

        cores_rodada = random.sample(cores_usadas[0], min(4, len(cores_usadas[0])))
        quadrados.clear()
        circulos.clear()

        # Quadrados no topo (alvos)
        tam_q = 130
        nq = len(cores_rodada)
        esp_q = (W - nq * tam_q) // (nq + 1)
        for i, (nome, cor) in enumerate(cores_rodada):
            x = esp_q + i * (tam_q + esp_q)
            r = pygame.Rect(x, 20, tam_q, tam_q)
            quadrados.append({"rect": r, "nome": nome, "cor": cor})

        # Círculos na parte inferior (embaralhados)
        cores_emb = cores_rodada[:]
        random.shuffle(cores_emb)
        tam_c = 110
        esp_c = (W - nq * tam_c) // (nq + 1)
        for i, (nome, cor) in enumerate(cores_emb):
            cx = esp_c + i * (tam_c + esp_c) + tam_c // 2
            cy = H - 120
            circulos.append({
                "nome": nome, "cor": cor,
                "x": float(cx), "y": float(cy),
                "raio": tam_c // 2,
                "orig_x": float(cx), "orig_y": float(cy),
                "pareado": False,
            })

    # Início
    falar_async("Olá amiguinho! Arraste os círculos para os quadrados da mesma cor. Vamos lá!", olhos)
    novo_round()

    rodando = True
    while rodando:
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                rodando = False

            # Coordenadas normalizadas para touch e mouse
            if e.type in (pygame.FINGERDOWN, pygame.FINGERUP, pygame.FINGERMOTION,
                          pygame.MOUSEBUTTONDOWN, pygame.MOUSEBUTTONUP, pygame.MOUSEMOTION):
                if e.type in (pygame.FINGERDOWN, pygame.FINGERUP, pygame.FINGERMOTION):
                    ex = int(e.x * W)
                    ey = int(e.y * H)
                else:
                    ex, ey = e.pos

            # --- Início do toque (selecionar círculo) ---
            if e.type in (pygame.FINGERDOWN, pygame.MOUSEBUTTONDOWN):
                for c in reversed(circulos):
                    if not c["pareado"] and math.hypot(c["x"] - ex, c["y"] - ey) < c["raio"] + 40:
                        arrastando[0] = c
                        circulos.remove(c)
                        circulos.append(c)  # Traz para frente
                        break

            # --- Fim do toque (soltar círculo) ---
            if e.type in (pygame.FINGERUP, pygame.MOUSEBUTTONUP) and arrastando[0]:
                c = arrastando[0]
                acertou = False
                for q in quadrados:
                    if c["nome"] == q["nome"]:
                        dist = math.hypot(c["x"] - q["rect"].centerx, c["y"] - q["rect"].centery)
                        if dist < 110:
                            c["x"] = float(q["rect"].centerx)
                            c["y"] = float(q["rect"].centery)
                            c["pareado"] = True
                            acertou = True
                            if olhos:
                                threading.Thread(target=olhos.olhar_feliz, daemon=True).start()
                            # Todos pareados?
                            if all(ci["pareado"] for ci in circulos):
                                acertos[0] += 1
                                criar_fogos(W // 2, H // 2)
                                frases = [
                                    "Parabéns! Você acertou tudo!",
                                    "Incrível! Arrasou demais!",
                                    "Muito bem! Que inteligente!",
                                    "Fantástico! Continue assim!",
                                ]
                                falar_async(random.choice(frases), olhos)
                                if olhos:
                                    threading.Thread(target=olhos.surpresa, daemon=True).start()
                                pygame.time.wait(3500)
                                novo_round()
                            else:
                                falar_async("Boa! Continue arrastando os outros.", olhos)
                            break

                if not acertou:
                    c["x"] = c["orig_x"]
                    c["y"] = c["orig_y"]
                    falar_async("Quase! Arraste para o quadrado da mesma cor.", olhos)
                    if olhos:
                        threading.Thread(target=olhos.olhar_triste, daemon=True).start()

                arrastando[0] = None

            # --- Movimento ---
            if e.type in (pygame.FINGERMOTION, pygame.MOUSEMOTION) and arrastando[0]:
                arrastando[0]["x"] = float(ex)
                arrastando[0]["y"] = float(ey)

        # ============ DESENHO ============
        tela.fill((235, 250, 255))

        # Linha divisória
        pygame.draw.line(tela, (180, 200, 215), (20, H // 2 + 20), (W - 20, H // 2 + 20), 2)

        # Quadrados (alvos)
        for q in quadrados:
            pygame.draw.rect(tela, q["cor"], q["rect"], border_radius=14)
            pygame.draw.rect(tela, (0, 0, 0), q["rect"], 5, border_radius=14)

        # Círculos
        for c in circulos:
            ix, iy = int(c["x"]), int(c["y"])
            pygame.draw.circle(tela, c["cor"], (ix, iy), c["raio"])
            borda = 8 if arrastando[0] is c else 5
            pygame.draw.circle(tela, (0, 0, 0), (ix, iy), c["raio"], borda)

        # Fogos de artifício
        for p in particulas[:]:
            p.atualizar()
            p.desenhar(tela)
            if p.vida <= 0:
                particulas.remove(p)

        # Instrução central (só quando não está arrastando)
        if not arrastando[0]:
            txt = fonte_instrucao.render("Arraste cada círculo para o quadrado da mesma cor!", True, (20, 60, 120))
            tela.blit(txt, txt.get_rect(center=(W // 2, H // 2 + 30)))

        # Placar
        placar = fonte_placar.render(f"Nível {nivel[0]}  •  Acertos: {acertos[0]}", True, (30, 30, 30))
        tela.blit(placar, (20, H - 38))

        pygame.display.flip()
        clock.tick(FPS)

    # Encerra
    if olhos:
        try: olhos.olhar_neutro()
        except: pass
    pygame.quit()

if __name__ == "__main__":
    main()
