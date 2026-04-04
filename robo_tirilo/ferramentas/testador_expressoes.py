#!/usr/bin/env python3
import os
import sys
import json
import pygame
import time
import threading

# Adiciona o diretório pai ao path para importar a classe ControladorOlhos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from olhos_tirilo import ControladorOlhos

def iniciar_gui():
    # --- CONFIGURAÇÃO DE DRIVERS DO RASPBERRY PI ---
    if "DISPLAY" not in os.environ:
        for driver in ['kmsdrm', 'drm', 'fbcon', 'directfb']:
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

    pygame.mouse.set_visible(True)
    pygame.display.set_caption("Laboratório de Expressões - Tirilo")
    
    # --- RECURSOS ---
    font_btn = pygame.font.Font(None, 28)
    font_sub = pygame.font.Font(None, 22)
    font_tit = pygame.font.Font(None, 40)
    
    # Cores
    PRETO    = (15, 15, 15)
    BRANCO   = (240, 240, 240)
    CINZA    = (40, 40, 40)
    AZUL     = (0, 120, 215)
    VERDE    = (0, 153, 0)
    VERMELHO = (204, 0, 0)
    AMARELO  = (220, 190, 0)
    ROXO     = (112, 48, 160)

    # --- HARDWARE ---
    try:
        tirilo = ControladorOlhos()
    except Exception as e:
        print(f"Erro Hardware: {e}")
        return

    # --- LÓGICA DE BOTÕES ---
    botoes = []
    
    def add_btn(x, y, w_btn, h_btn, texto, cor, acao, sub=""):
        botoes.append({
            "rect": pygame.Rect(x, y, w_btn, h_btn),
            "texto": texto,
            "sub": sub,
            "cor": cor,
            "acao": acao
        })

    # Layout: 4 colunas
    col_w = w // 4
    margem = 15
    bw = col_w - (margem * 2)
    bh = 70

    # Coluna 1: Expressões
    y = 80
    add_btn(margem, y, bw, bh, "NEUTRO", AZUL, lambda: tirilo.olhar_neutro())
    y += bh + margem
    add_btn(margem, y, bw, bh, "FELIZ", VERDE, lambda: tirilo.olhar_feliz())
    y += bh + margem
    add_btn(margem, y, bw, bh, "TRISTE", ROXO, lambda: tirilo.olhar_triste())
    y += bh + margem
    add_btn(margem, y, bw, bh, "BRAVO", VERMELHO, lambda: tirilo.olhar_bravo())

    # Coluna 2: Expressões +
    y = 80
    add_btn(col_w + margem, y, bw, bh, "SURPRESA", AMARELO, lambda: tirilo.surpresa())
    y += bh + margem
    add_btn(col_w + margem, y, bw, bh, "CIMA", CINZA, lambda: tirilo.olhar_cima())
    y += bh + margem
    add_btn(col_w + margem, y, bw, bh, "FRENTE", CINZA, lambda: tirilo.olhar_frente())
    y += bh + margem
    add_btn(col_w + margem, y, bw, bh, "DESCONFIADO", ROXO, lambda: tirilo.desconfiado())

    # Coluna 3: Movimentos
    y = 80
    add_btn(col_w*2 + margem, y, bw, bh, "PISCAR", BRANCO, lambda: tirilo.piscar_natural(), "Natural")
    y += bh + margem
    add_btn(col_w*2 + margem, y, bw, bh, "VESGO", AZUL, lambda: tirilo.olhar_vesgo())
    y += bh + margem
    add_btn(col_w*2 + margem, y, bw, bh, "ADIVINHAR", CINZA, lambda: tirilo.olhar_ao_redor(), "Olhar ao Redor")
    y += bh + margem
    add_btn(col_w*2 + margem, y, bw, bh, "GALOPE", AMARELO, lambda: tirilo.alternar_piscar(), "Pisca Clock")

    # Coluna 4: Testes Manuais (Sub-menu rápido)
    y = 80
    add_btn(col_w*3 + margem, y, bw, bh, "ABRIR BOCA", VERDE, lambda: tirilo.mover_boca(100))
    y += bh + margem
    add_btn(col_w*3 + margem, y, bw, bh, "FECHAR BOCA", VERMELHO, lambda: tirilo.mover_boca(0))
    y += bh + margem
    add_btn(col_w*3 + margem, y, bw, bh, "ABRIR OLHOS", VERDE, lambda: tirilo.mover_suave_ambos(p_alvo=0))
    y += bh + margem
    add_btn(col_w*3 + margem, y, bw, bh, "FECHAR OLHOS", VERMELHO, lambda: tirilo.mover_suave_ambos(p_alvo=100))

    # Botão Sair
    btn_sair = pygame.Rect(w/2 - 60, h - 60, 120, 45)

    msg_status = "Toque em um botão para testar"
    
    clock = pygame.time.Clock()
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: running = False
            
            click_pos = None
            if event.type == pygame.MOUSEBUTTONDOWN: click_pos = event.pos
            if event.type == pygame.FINGERDOWN: click_pos = (int(event.x*w), int(event.y*h))
            
            if click_pos:
                if btn_sair.collidepoint(click_pos):
                    running = False
                for b in botoes:
                    if b["rect"].collidepoint(click_pos):
                        msg_status = f"Executando: {b['texto']}"
                        # Executa em thread para não travar a interface
                        threading.Thread(target=b["acao"], daemon=True).start()

        # Render
        tela.fill(PRETO)
        
        # Título
        txt_tit = font_tit.render("LABORATÓRIO DE EXPRESSÕES", True, AMARELO)
        tela.blit(txt_tit, (w/2 - txt_tit.get_width()/2, 20))

        # Botões
        for b in botoes:
            pygame.draw.rect(tela, b["cor"], b["rect"], border_radius=8)
            # Texto principal
            color_text = PRETO if b["cor"] == BRANCO or b["cor"] == AMARELO else BRANCO
            txt = font_btn.render(b["texto"], True, color_text)
            tela.blit(txt, (b["rect"].centerx - txt.get_width()/2, b["rect"].centery - (10 if b["sub"] else 0) - txt.get_height()/2))
            # Sub-texto
            if b["sub"]:
                txt_s = font_sub.render(b["sub"], True, color_text)
                tela.blit(txt_s, (b["rect"].centerx - txt_s.get_width()/2, b["rect"].centery + 12))

        # Rodapé / Status
        pygame.draw.rect(tela, CINZA, (0, h-75, w, 75))
        txt_st = font_btn.render(msg_status, True, VERDE)
        tela.blit(txt_st, (w/2 - txt_st.get_width()/2, h - 55))

        # Botão Sair (sobre o rodapé)
        pygame.draw.rect(tela, VERMELHO, btn_sair, border_radius=5)
        txt_sair = font_btn.render("SAIR", True, BRANCO)
        tela.blit(txt_sair, (btn_sair.centerx - txt_sair.get_width()/2, btn_sair.centery - txt_sair.get_height()/2))

        pygame.display.flip()
        clock.tick(30)

    pygame.quit()

if __name__ == "__main__":
    iniciar_gui()
