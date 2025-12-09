# arrastar_cor.py – VERSÃO FINAL SEM ERRO DE FBCON
# Arraste o círculo para o quadrado da mesma cor
# Funciona 100% no Raspberry Pi 3 + tela touch 5"

import pygame
import asyncio
import edge_tts
import os
import random
import threading
import shutil
import math

# ============ CONFIGURAÇÕES SIMPLES (SEM DRIVERS PROBLEMÁTICOS) ============
LARGURA, ALTURA = 800, 480
FPS = 50

CORES_NOME = {
    "vermelho": (255,   0,   0),
    "azul":     (  0,   0, 255),
    "verde":    (  0, 255,   0),
    "amarelo":  (255, 255,   0),
    "roxo":     (128,   0, 128),
    "laranja":  (255, 165,   0),
    "rosa":     (255, 192, 203),
    "marrom":   (139,  69,  19)
}

# ====================== INICIA PYGAME (SEM VARIÁVEIS DE DRIVER) ======================
pygame.init()
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Arraste o Círculo!")
pygame.mouse.set_visible(False)  # Cursor invisível para tela touch
clock = pygame.time.Clock()

fonte_grande = pygame.font.SysFont("arial", 70, bold=True)
fonte_media  = pygame.font.SysFont("arial", 50)

os.makedirs("temp_audio", exist_ok=True)

# ====================== VOZ ======================
async def falar(texto, voz="pt-BR-AntonioNeural"):
    arquivo = f"temp_audio/audio_{abs(hash(texto))}.mp3"
    if not os.path.exists(arquivo):
        try:
            communicate = edge_tts.Communicate(texto, voz)
            await communicate.save(arquivo)
        except:
            return
    pygame.mixer.music.load(arquivo)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        await asyncio.sleep(0.1)

def falar_async(texto):
    threading.Thread(target=lambda: asyncio.run(falar(texto)), daemon=True).start()

# ====================== FOGOS ======================
class Particula:
    def __init__(self, x, y):
        self.x = x + random.randint(-30, 30)
        self.y = y + random.randint(-30, 30)
        self.cor = random.choice(list(CORES_NOME.values()))
        self.vx = random.randint(-20, 20)
        self.vy = random.randint(-30, -10)
        self.vida = 90

    def atualizar(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.8
        self.vida -= 1

    def desenhar(self):
        if self.vida > 0:
            pygame.draw.circle(tela, self.cor, (int(self.x), int(self.y)), max(3, self.vida // 8))

particulas = []

def criar_fogos():
    for _ in range(200):
        particulas.append(Particula(LARGURA // 2, ALTURA // 2))

# ====================== JOGO ======================
nivel = 1
acertos = 0
cores_usadas = list(CORES_NOME.items())[:4]

quadrados = []
circulos = []
circulo_arrastando = None

def novo_round():
    global quadrados, circulos, nivel, cores_usadas

    if acertos > 0 and acertos % 6 == 0:
        nivel += 1
        cores_usadas = list(CORES_NOME.items())[:min(8, 3 + nivel)]

    cores_rodada = random.sample(cores_usadas, 4)
    quadrados.clear()
    circulos.clear()

    # Quadrados fixos (cima)
    tam = 140
    esp = (LARGURA - 4 * tam) // 5
    for i, (nome, cor) in enumerate(cores_rodada):
        x = esp + i * (tam + esp)
        r = pygame.Rect(x, 70, tam, tam)
        quadrados.append({"rect": r, "nome": nome, "cor": cor})

    # Círculos arrastáveis (baixo – embaralhados)
    random.shuffle(cores_rodada)
    tam_c = 120
    esp_c = (LARGURA - 4 * tam_c) // 5
    for i, (nome, cor) in enumerate(cores_rodada):
        x = esp_c + i * (tam_c + esp_c)
        cx = x + tam_c // 2
        cy = ALTURA - tam_c - 90
        circulos.append({
            "nome": nome,
            "cor": cor,
            "x": cx,
            "y": cy,
            "raio": tam_c // 2
        })

# Início
falar_async("Olá amiguinho! Arraste os círculos para os quadrados da mesma cor. Vamos lá?")
novo_round()

# ====================== LOOP PRINCIPAL ======================
rodando = True

while rodando:
    for e in pygame.event.get():
        if e.type == pygame.QUIT:
            rodando = False

        # TOQUE INÍCIO
        if e.type in (pygame.FINGERDOWN, pygame.MOUSEBUTTONDOWN):
            if e.type == pygame.FINGERDOWN:
                tx = int(e.x * LARGURA)
                ty = int(e.y * ALTURA)
            else:
                tx, ty = e.pos

            for c in circulos[::-1]:
                if math.hypot(c["x"] - tx, c["y"] - ty) < c["raio"] + 40:
                    circulo_arrastando = c
                    # Traz para frente no desenho
                    circulos.remove(c)
                    circulos.append(c)
                    break

        # TOQUE FIM
        if e.type in (pygame.FINGERUP, pygame.MOUSEBUTTONUP) and circulo_arrastando:
            acertou = False
            for q in quadrados:
                if circulo_arrastando["nome"] == q["nome"]:
                    if math.hypot(circulo_arrastando["x"] - q["rect"].centerx,
                                  circulo_arrastando["y"] - q["rect"].centery) < 110:
                        circulo_arrastando["x"] = q["rect"].centerx
                        circulo_arrastando["y"] = q["rect"].centery
                        acertou = True
                        break

            if acertou:
                # Todos os círculos no lugar certo?
                if all(math.hypot(c["x"] - next(q["rect"].centerx for q in quadrados if q["nome"] == c["nome"]),
                                  c["y"] - next(q["rect"].centery for q in quadrados if q["nome"] == c["nome"])) < 110
                       for c in circulos):
                    acertos += 1
                    criar_fogos()
                    falar_async(random.choice(["Parabéns! Você acertou tudo!", "Incrível!", "Muito bem!", "Arrasou!", "Fantástico!"]))
                    pygame.time.wait(3500)
                    novo_round()
                else:
                    falar_async("Boa! Continue arrastando os outros.")
            else:
                falar_async("Quase lá… arraste para o quadrado da mesma cor.")

            circulo_arrastando = None

        # MOVIMENTO (arrastar com dedo)
        if e.type in (pygame.FINGERMOTION, pygame.MOUSEMOTION) and circulo_arrastando:
            if e.type == pygame.FINGERMOTION:
                circulo_arrastando["x"] = int(e.x * LARGURA)
                circulo_arrastando["y"] = int(e.y * ALTURA)
            else:
                circulo_arrastando["x"], circulo_arrastando["y"] = e.pos

    # ====================== DESENHO ======================
    tela.fill((235, 250, 255))  # Fundo calmo

    # Desenha quadrados (alvos)
    for q in quadrados:
        pygame.draw.rect(tela, q["cor"], q["rect"])
        pygame.draw.rect(tela, (0, 0, 0), q["rect"], 12)

    # Desenha círculos
    for c in circulos:
        pygame.draw.circle(tela, c["cor"], (int(c["x"]), int(c["y"])), c["raio"])
        pygame.draw.circle(tela, (0, 0, 0), (int(c["x"]), int(c["y"])), c["raio"], 10)

    # Instrução
    texto = fonte_grande.render("Arraste os círculos para a cor certa!", True, (0, 0, 0))
    tela.blit(texto, texto.get_rect(center=(LARGURA // 2, 20)))

    # Placar
    placar = fonte_media.render(f"Nível {nivel}  •  Acertos: {acertos}", True, (30, 30, 30))
    tela.blit(placar, (20, ALTURA - 60))

    # Fogos de artifício
    for p in particulas[:]:
        p.atualizar()
        p.desenhar()
        if p.vida <= 0:
            particulas.remove(p)

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
try:
    shutil.rmtree("temp_audio")
except:
    pass