#!/usr/bin/env python3
import os
import cv2
import pygame
import time
import sys

# Tenta importar Picamera2 (Nativo Pi 5)
try:
    from picamera2 import Picamera2
    PICAMERA2_DISPONIVEL = True
except ImportError:
    PICAMERA2_DISPONIVEL = False

# Configurações
LARGURA_TELA = 800
ALTURA_TELA = 480
LARGURA_CAM = 640
ALTURA_CAM = 480

def iniciar_gui():
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
    return pygame.display.set_mode((LARGURA_TELA, ALTURA_TELA))

def testar():
    print(f"Versão OpenCV: {cv2.__version__}")
    print(f"Picamera2 disponível: {PICAMERA2_DISPONIVEL}")
    
    tela = iniciar_gui()
    fonte = pygame.font.Font(None, 36)
    
    cap_picam = None
    if PICAMERA2_DISPONIVEL:
        print("Iniciando Picamera2...")
        try:
            cap_picam = Picamera2()
            config = cap_picam.create_video_configuration(main={"size": (LARGURA_CAM, ALTURA_CAM), "format": "RGB888"})
            cap_picam.configure(config)
            cap_picam.start()
            print("Sucesso ao iniciar Picamera2!")
        except Exception as e:
            print(f"Erro ao iniciar Picamera2: {e}")
            cap_picam = None

    # Fallback para OpenCV se Picamera2 falhar
    cap_cv2 = None
    if not cap_picam:
        print("Picamera2 falhou ou indisponível. Tentando OpenCV direto...")
        cap_cv2 = cv2.VideoCapture(0)
        if not cap_cv2.isOpened():
            print("ERRO: Nenhuma fonte de vídeo funcionou.")
            return

    print("Iniciando loop de vídeo...")
    rodando = True
    clock = pygame.time.Clock()

    while rodando:
        for event in pygame.event.get():
            if event.type == pygame.QUIT or event.type == pygame.KEYDOWN:
                rodando = False

        frame_rgb = None
        if cap_picam:
            frame_rgb = cap_picam.capture_array()
        elif cap_cv2:
            ret, frame = cap_cv2.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if frame_rgb is not None:
            # Resize para o Pygame
            h, w, _ = frame_rgb.shape
            img = pygame.image.frombuffer(frame_rgb.tobytes(), (w, h), 'RGB')
            img = pygame.transform.scale(img, (LARGURA_TELA, ALTURA_TELA))
            
            tela.blit(img, (0, 0))
            txt = fonte.render("Visão Mágica Ativa - Pi 5", True, (0, 255, 0))
            tela.blit(txt, (20, 20))
            pygame.display.flip()
        else:
            print("Falha ao capturar imagem.")
            time.sleep(0.1)

    if cap_picam: cap_picam.stop()
    if cap_cv2: cap_cv2.release()
    pygame.quit()

if __name__ == "__main__":
    testar()
