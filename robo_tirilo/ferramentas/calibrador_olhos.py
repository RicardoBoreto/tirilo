#!/usr/bin/env python3
import os
import json
import pygame
import time

try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16)
    HARDWARE_DISPONIVEL = True
except Exception as e:
    print(f"Aviso: Hardware PCA9685 não detectado ou erro na biblioteca: {e}")
    HARDWARE_DISPONIVEL = False

# --------- CONFIGURAÇÃO PADRÃO ---------
ARQUIVO_CONFIG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config_olhos.json")

def carregar_config():
    if os.path.exists(ARQUIVO_CONFIG):
        with open(ARQUIVO_CONFIG, 'r') as f:
            cfg = json.load(f)
            # Patch para garantir que "boca" exista na configuracao carregada
            if "boca" not in cfg["olho_direito"]:
                cfg["olho_direito"]["boca"] = {"porta": 8, "min": 0, "max": 180, "centro": 90}
                cfg["olho_esquerdo"]["boca"] = {"porta": -1, "min": 0, "max": 180, "centro": 90}
            return cfg
    else:
        # Configuração inicial caso o arquivo não exista
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

def aplicar_angulo_servo(porta, angulo):
    if HARDWARE_DISPONIVEL and porta >= 0:
        if 0 <= angulo <= 180:
            try:
                kit.servo[porta].angle = angulo
            except Exception as e:
                print(f"Erro ao mover servo na porta {porta}: {e}")

# --------- INTERFACE GRÁFICA (PYGAME) ---------

def iniciar_gui():
    # Suporte para OS Lite (sem X11) no Pi 5
    if "DISPLAY" not in os.environ:
        # Tenta drivers KMSDRM com índices diferentes (Pi 5 pode ter múltiplos)
        for driver in ['kmsdrm', 'drm']:
            for index in ['0', '1']:
                try:
                    os.environ["SDL_VIDEODRIVER"] = driver
                    os.environ["SDL_KMSDRM_DEVICE_INDEX"] = index
                    pygame.display.init()
                    print(f"Pygame: Driver '{driver}' (Index {index}) inicializado.")
                    break
                except pygame.error:
                    continue
            if pygame.display.get_init(): break
        
        # Fallback final se nada acima funcionou
        if not pygame.display.get_init():
            try:
                os.environ["SDL_VIDEODRIVER"] = "x11"
                pygame.display.init()
            except: pass
    
    os.environ['SDL_VIDEO_CENTERED'] = '1'
    pygame.init()
    
    try:
        info = pygame.display.Info()
        w, h = info.current_w, info.current_h
        tela = pygame.display.set_mode((w, h), pygame.FULLSCREEN)
    except:
        w, h = 800, 480
        tela = pygame.display.set_mode((w, h))

    # Driver de Touch do Rasp
    os.environ["SDL_MOUSEDRV"] = "evdev"
    os.environ["SDL_MOUSEDEV"] = "/dev/input/event3"
    
    pygame.mouse.set_visible(True)
    pygame.display.set_caption("Calibrador Dual - Robô Tirilo")
    
    # Fontes
    font_titulo = pygame.font.Font(None, 40)
    font_texto = pygame.font.Font(None, 30)
    font_botao = pygame.font.Font(None, 24)
    font_valor = pygame.font.Font(None, 70)

    # Cores
    BRANCO = (255, 255, 255)
    PRETO = (10, 10, 10)
    CINZA_ESCURO = (30, 30, 30)
    CINZA_CLARO = (120, 120, 120)
    AZUL = (0, 100, 255)
    VERDE = (0, 180, 0)
    VERMELHO = (180, 0, 0)
    AMARELO = (200, 180, 0)

    # Estado
    mecanismos = ["vertical", "horizontal", "palpebra_cima", "palpebra_baixo", "boca"]
    idx_mecanismo = 0
    mecanismo_atual = mecanismos[idx_mecanismo]
    
    # Angulos atuais de trabalho (iniciam no centro salvo)
    ang_dir = configuracao["olho_direito"][mecanismo_atual]["centro"]
    ang_esq = configuracao["olho_esquerdo"][mecanismo_atual]["centro"]
    
    msg_status = "Ajuste os dois olhos simultaneamente."
    msg_timer = pygame.time.get_ticks()

    def atualizar_servos():
        p_dir = configuracao["olho_direito"][mecanismo_atual]["porta"]
        p_esq = configuracao["olho_esquerdo"][mecanismo_atual]["porta"]
        aplicar_angulo_servo(p_dir, ang_dir)
        aplicar_angulo_servo(p_esq, ang_esq)

    def mudar_mecanismo(delta):
        nonlocal idx_mecanismo, mecanismo_atual, ang_dir, ang_esq
        idx_mecanismo = (idx_mecanismo + delta) % len(mecanismos)
        mecanismo_atual = mecanismos[idx_mecanismo]
        ang_dir = configuracao["olho_direito"][mecanismo_atual]["centro"]
        ang_esq = configuracao["olho_esquerdo"][mecanismo_atual]["centro"]
        atualizar_servos()

    def draw_text(superf, txt, font, color, x, y, center=False):
        img = font.render(txt, True, color)
        rect = img.get_rect()
        if center: rect.center = (x, y)
        else: rect.topleft = (x, y)
        superf.blit(img, rect)

    def draw_button(rect, txt, color, font):
        pygame.draw.rect(tela, color, rect, border_radius=6)
        draw_text(tela, txt, font, BRANCO, rect.centerx, rect.centery, center=True)

    # LAYOUT
    # Topo: Seletor de Mecanismo
    btn_mec_prev = pygame.Rect(w*0.05, 10, 60, 50)
    btn_mec_next = pygame.Rect(w*0.95 - 60, 10, 60, 50)
    
    # Paineis Lado a Lado
    margem = 20
    larg_painel = (w - margem*3) / 2
    y_painel = 80
    alt_painel = h - 180
    
    rect_painel_dir = pygame.Rect(margem, y_painel, larg_painel, alt_painel)
    rect_painel_esq = pygame.Rect(margem*2 + larg_painel, y_painel, larg_painel, alt_painel)

    def get_ctrl_rects(panel_rect):
        ry = panel_rect.y + 60
        bw = (panel_rect.width - 40) / 3
        return {
            "m10": pygame.Rect(panel_rect.x + 10, ry, bw, 60),
            "m1":  pygame.Rect(panel_rect.x + 20 + bw, ry, bw, 60),
            "p1":  pygame.Rect(panel_rect.x + panel_rect.width - bw - 10, ry, bw, 60),
            "p10": pygame.Rect(panel_rect.x + panel_rect.width - bw*2 - 20, ry, bw, 60), # Reajustar ordem
            "save_min": pygame.Rect(panel_rect.x + 10, ry + 120, bw, 50),
            "save_cen": pygame.Rect(panel_rect.x + 20 + bw, ry + 120, bw, 50),
            "save_max": pygame.Rect(panel_rect.x + panel_rect.width - bw - 10, ry + 120, bw, 50),
            "test_min": pygame.Rect(panel_rect.x + 10, ry + 180, bw, 40),
            "test_cen": pygame.Rect(panel_rect.x + 20 + bw, ry + 180, bw, 40),
            "test_max": pygame.Rect(panel_rect.x + panel_rect.width - bw - 10, ry + 180, bw, 40)
        }
    
    # Ajuste manual da posição dos botões +/- para ficarem intuitivos
    def fix_btn_pos(p):
        mid_x = p.centerx
        bw = 60
        return {
            "m10": pygame.Rect(mid_x - 130, p.y + 110, 60, 60),
            "m1":  pygame.Rect(mid_x - 65, p.y + 110, 60, 60),
            "p1":  pygame.Rect(mid_x + 5, p.y + 110, 60, 60),
            "p10": pygame.Rect(mid_x + 70, p.y + 110, 60, 60),
            "s_min": pygame.Rect(p.x + 10, p.y + 190, (p.width-40)/3, 50),
            "s_cen": pygame.Rect(p.x + 20 + (p.width-40)/3, p.y + 190, (p.width-40)/3, 50),
            "s_max": pygame.Rect(p.x + 30 + 2*(p.width-40)/3, p.y + 190, (p.width-40)/3, 50),
            "t_min": pygame.Rect(p.x + 10, p.y + 250, (p.width-40)/3, 40),
            "t_cen": pygame.Rect(p.x + 20 + (p.width-40)/3, p.y + 250, (p.width-40)/3, 40),
            "t_max": pygame.Rect(p.x + 30 + 2*(p.width-40)/3, p.y + 250, (p.width-40)/3, 40),
        }

    ctrl_dir = fix_btn_pos(rect_painel_dir)
    ctrl_esq = fix_btn_pos(rect_painel_esq)
    
    btn_sair = pygame.Rect(w/2 - 50, h - 50, 100, 40)

    atualizar_servos()
    clock = pygame.time.Clock()
    running = True

    def handle_click(pos):
        nonlocal ang_dir, ang_esq, msg_status, msg_timer, running
        # Topo
        if btn_mec_prev.collidepoint(pos): mudar_mecanismo(-1)
        elif btn_mec_next.collidepoint(pos): mudar_mecanismo(1)
        
        # Olho Direito
        elif ctrl_dir["m10"].collidepoint(pos): ang_dir -= 10
        elif ctrl_dir["m1"].collidepoint(pos):  ang_dir -= 1
        elif ctrl_dir["p1"].collidepoint(pos):  ang_dir += 1
        elif ctrl_dir["p10"].collidepoint(pos): ang_dir += 10
        elif ctrl_dir["s_min"].collidepoint(pos):
            configuracao["olho_direito"][mecanismo_atual]["min"] = ang_dir
            salvar_config(configuracao); msg_status = "MIN Direito Salvo"
        elif ctrl_dir["s_cen"].collidepoint(pos):
            configuracao["olho_direito"][mecanismo_atual]["centro"] = ang_dir
            salvar_config(configuracao); msg_status = "CENTRO Direito Salvo"
        elif ctrl_dir["s_max"].collidepoint(pos):
            configuracao["olho_direito"][mecanismo_atual]["max"] = ang_dir
            salvar_config(configuracao); msg_status = "MAX Direito Salvo"
        elif ctrl_dir["t_min"].collidepoint(pos): ang_dir = configuracao["olho_direito"][mecanismo_atual]["min"]
        elif ctrl_dir["t_cen"].collidepoint(pos): ang_dir = configuracao["olho_direito"][mecanismo_atual]["centro"]
        elif ctrl_dir["t_max"].collidepoint(pos): ang_dir = configuracao["olho_direito"][mecanismo_atual]["max"]

        # Olho Esquerdo
        elif ctrl_esq["m10"].collidepoint(pos): ang_esq -= 10
        elif ctrl_esq["m1"].collidepoint(pos):  ang_esq -= 1
        elif ctrl_esq["p1"].collidepoint(pos):  ang_esq += 1
        elif ctrl_esq["p10"].collidepoint(pos): ang_esq += 10
        elif ctrl_esq["s_min"].collidepoint(pos):
            configuracao["olho_esquerdo"][mecanismo_atual]["min"] = ang_esq
            salvar_config(configuracao); msg_status = "MIN Esquerdo Salvo"
        elif ctrl_esq["s_cen"].collidepoint(pos):
            configuracao["olho_esquerdo"][mecanismo_atual]["centro"] = ang_esq
            salvar_config(configuracao); msg_status = "CENTRO Esquerdo Salvo"
        elif ctrl_esq["s_max"].collidepoint(pos):
            configuracao["olho_esquerdo"][mecanismo_atual]["max"] = ang_esq
            salvar_config(configuracao); msg_status = "MAX Esquerdo Salvo"
        elif ctrl_esq["t_min"].collidepoint(pos): ang_esq = configuracao["olho_esquerdo"][mecanismo_atual]["min"]
        elif ctrl_esq["t_cen"].collidepoint(pos): ang_esq = configuracao["olho_esquerdo"][mecanismo_atual]["centro"]
        elif ctrl_esq["t_max"].collidepoint(pos): ang_esq = configuracao["olho_esquerdo"][mecanismo_atual]["max"]

        elif btn_sair.collidepoint(pos): running = False
        
        # Limites
        ang_dir = max(0, min(180, ang_dir))
        ang_esq = max(0, min(180, ang_esq))
        atualizar_servos()
        msg_timer = pygame.time.get_ticks()

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: running = False
            if event.type == pygame.MOUSEBUTTONDOWN: handle_click(event.pos)
            if event.type == pygame.FINGERDOWN: handle_click((int(event.x*w), int(event.y*h)))

        tela.fill(PRETO)
        
        # Topo
        draw_button(btn_mec_prev, "<", CINZA_ESCURO, font_titulo)
        draw_button(btn_mec_next, ">", CINZA_ESCURO, font_titulo)
        draw_text(tela, f"MECANISMO: {mecanismo_atual.upper()}", font_titulo, AMARELO, w/2, 35, center=True)

        # Paineis
        def draw_panel(rect, titulo, ang, ctrls):
            pygame.draw.rect(tela, CINZA_ESCURO, rect, border_radius=10)
            draw_text(tela, titulo, font_titulo, BRANCO, rect.centerx, rect.y + 30, center=True)
            draw_text(tela, f"{int(ang)}°", font_valor, VERDE, rect.centerx, rect.y + 75, center=True)
            
            draw_button(ctrls["m10"], "-10", AZUL, font_botao)
            draw_button(ctrls["m1"], "-1", AZUL, font_botao)
            draw_button(ctrls["p1"], "+1", AZUL, font_botao)
            draw_button(ctrls["p10"], "+10", AZUL, font_botao)
            
            draw_button(ctrls["s_min"], "SALVAR MIN", CINZA_CLARO, font_botao)
            draw_button(ctrls["s_cen"], "SALVAR CEN", AMARELO, font_botao)
            draw_button(ctrls["s_max"], "SALVAR MAX", CINZA_CLARO, font_botao)
            
            draw_button(ctrls["t_min"], "TESTE MIN", CINZA_ESCURO, font_botao)
            draw_button(ctrls["t_cen"], "TESTE CEN", CINZA_ESCURO, font_botao)
            draw_button(ctrls["t_max"], "TESTE MAX", CINZA_ESCURO, font_botao)

        if mecanismo_atual == "boca":
            draw_panel(rect_painel_dir, "BOCA (USE ESTE)", ang_dir, ctrl_dir)
            draw_panel(rect_painel_esq, "BOCA (DESATIVADO)", ang_esq, ctrl_esq)
        else:
            draw_panel(rect_painel_dir, "OLHO DIREITO", ang_dir, ctrl_dir)
            draw_panel(rect_painel_esq, "OLHO ESQUERDO", ang_esq, ctrl_esq)

        draw_button(btn_sair, "SAIR", VERMELHO, font_botao)
        
        if pygame.time.get_ticks() - msg_timer < 2000:
            draw_text(tela, msg_status, font_texto, VERDE, w/2, h - 80, center=True)

        pygame.display.flip()
        clock.tick(30)

    pygame.quit()

if __name__ == "__main__":
    iniciar_gui()
