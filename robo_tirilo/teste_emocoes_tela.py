#!/usr/bin/env python3
import os
import sys
import pygame
import threading
import time

# Garante que ele ache a classe olhos_tirilo no mesmo diretório
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from olhos_tirilo import ControladorOlhos
except ImportError:
    print("ERRO: Arquivo olhos_tirilo.py não encontrado no diretório!")
    sys.exit(1)

def iniciar_gui_teste():
    # Inicialização Pygame adaptada para OS Lite (KMS/DRM) Pi 5
    if "DISPLAY" not in os.environ:
        for driver in ['kmsdrm', 'drm']:
            for index in ['0', '1']:
                try:
                    os.environ["SDL_VIDEODRIVER"] = driver
                    os.environ["SDL_KMSDRM_DEVICE_INDEX"] = index
                    pygame.display.init()
                    break
                except pygame.error:
                    continue
            if pygame.display.get_init(): break

    os.environ['SDL_VIDEO_CENTERED'] = '1'
    pygame.init()
    
    try:
        info = pygame.display.Info()
        w, h = info.current_w, info.current_h
        tela = pygame.display.set_mode((w, h), pygame.FULLSCREEN)
    except:
        w, h = 800, 480
        tela = pygame.display.set_mode((w, h))

    # Configuração de Touch (Driver evdev do Raspberry Pi)
    os.environ["SDL_MOUSEDRV"] = "evdev"
    os.environ["SDL_MOUSEDEV"] = "/dev/input/event3"
    
    pygame.mouse.set_visible(True)
    pygame.display.set_caption("Painel de Emoções Tirilo")
    
    # Fontes
    font_titulo = pygame.font.Font(None, 42)
    font_texto = pygame.font.Font(None, 28)
    font_botao = pygame.font.Font(None, 24)

    # Paleta de Cores
    BRANCO = (240, 240, 240)
    PRETO = (15, 15, 15)
    CINZA_ESCURO = (40, 40, 40)
    CINZA_CLARO = (120, 120, 120)
    CINZA_BOTAO = (60, 60, 60)
    AZUL = (0, 110, 230)
    VERDE = (0, 160, 50)
    VERMELHO = (190, 30, 30)
    AMARELO = (210, 170, 0)

    # Inicializa controlador de hardware
    olhos = ControladorOlhos()
    msg_status = "Sistema Pronto." if olhos.config else "ERRO: JSON de configuração ausente!"
    msg_timer = pygame.time.get_ticks()

    def draw_text(superf, txt, font, color, x, y, center=False):
        img = font.render(txt, True, color)
        rect = img.get_rect()
        if center: rect.center = (x, y)
        else: rect.topleft = (x, y)
        superf.blit(img, rect)

    def draw_button(rect, txt, color, font):
        pygame.draw.rect(tela, color, rect, border_radius=10)
        draw_text(tela, txt, font, BRANCO, rect.centerx, rect.centery, center=True)

    def rodar_animacao(func, nome, args=None):
        nonlocal msg_status, msg_timer
        if args: threading.Thread(target=func, args=args, daemon=True).start()
        else: threading.Thread(target=func, daemon=True).start()
        msg_status = f"Executando: {nome}"
        msg_timer = pygame.time.get_ticks()

    # GRADE DE BOTÕES (4 linhas x 3 colunas)
    colunas = 3
    largura_btn = (w * 0.9) / colunas
    altura_btn = 75
    espaco_x = (w * 0.1) / (colunas + 1)
    espaco_y = 15
    y_start = 100

    acoes = [
        {"txt": "Olhar Neutro", "cor": CINZA_BOTAO, "f": olhos.olhar_neutro},
        {"txt": "Surpresa!", "cor": AMARELO, "f": olhos.surpresa},
        {"txt": "Dormir (Anim)", "cor": AZUL, "f": olhos.animacao_dormir},
        {"txt": "Olhar ao Redor", "cor": VERDE, "f": olhos.olhar_ao_redor},
        {"txt": "Piscar Ambos", "cor": CINZA_ESCURO, "f": olhos.piscar},
        {"txt": "Acordar (Anim)", "cor": VERMELHO, "f": olhos.animacao_acordar},
        {"txt": "Pisca Direito", "cor": CINZA_CLARO, "f": olhos.pisca_um_olho, "a": ("olho_direito",)},
        {"txt": "Pisca Esquerdo", "cor": CINZA_CLARO, "f": olhos.pisca_um_olho, "a": ("olho_esquerdo",)},
        {"txt": "Olhar Triste", "cor": CINZA_ESCURO, "f": olhos.olhar_triste},
        {"txt": "Desconfiado", "cor": CINZA_ESCURO, "f": olhos.desconfiado},
        {"txt": "Felicidade", "cor": VERDE, "f": olhos.olhar_feliz},
        {"txt": "Olhar Lados", "cor": AZUL, "f": olhos.mover_suave_ambos, "a": (20, 50, 30, 1.2)},
    ]

    rects = []
    for i in range(len(acoes)):
        c, r = i % colunas, i // colunas
        px = espaco_x + c * (largura_btn + espaco_x)
        py = y_start + r * (altura_btn + espaco_y)
        rects.append(pygame.Rect(px, py, largura_btn, altura_btn))

    btn_sair = pygame.Rect(w/2 - 60, h - 55, 120, 45)
    clock = pygame.time.Clock()
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: running = False
            
            # Click ou Touch
            pos = None
            if event.type == pygame.MOUSEBUTTONDOWN: pos = event.pos
            elif event.type == pygame.FINGERDOWN: pos = (int(event.x*w), int(event.y*h))
            
            if pos:
                for idx, r in enumerate(rects):
                    if r.collidepoint(pos):
                        a = acoes[idx]
                        rodar_animacao(a["f"], a["txt"], a.get("a"))
                if btn_sair.collidepoint(pos): running = False

        # --- DESENHO ---
        tela.fill(PRETO)
        draw_text(tela, "PAINEL DE EMOÇÕES TIRILO", font_titulo, AMARELO, w/2, 40, center=True)
        draw_text(tela, "Toque para testar os movimentos suaves e piscada individual.", font_texto, CINZA_CLARO, w/2, 75, center=True)

        for i, r in enumerate(rects):
            draw_button(r, acoes[i]["txt"], acoes[i]["cor"], font_botao)

        draw_button(btn_sair, "SAIR", VERMELHO, font_botao)

        if pygame.time.get_ticks() - msg_timer < 3000:
            draw_text(tela, msg_status, font_texto, VERDE, w/2, h - 85, center=True)

        pygame.display.flip()
        clock.tick(30)

    pygame.quit()

if __name__ == "__main__":
    iniciar_gui_teste()
