#!/usr/bin/env python3
import os
import cv2
import pygame
import time
import sys

# Configurações
LARGURA_TELA = 800
ALTURA_TELA = 480
LARGURA_CAM = 640  # Aumentando um pouco para o Pi 5
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
    build_info = cv2.getBuildInformation()
    print(f"GStreamer disponível: {build_info.find('GStreamer: YES') != -1}")
    
    tela = iniciar_gui()
    fonte = pygame.font.Font(None, 36)
    
    # Pipelines GStreamer para o Pi 5
    pipelines = [
        # Opção 1: Libcamera pura (mais chance no Pi 5)
        ("libcamerasrc ! video/x-raw, width=640, height=480 ! videoconvert ! appsink", "LIBCAMERASRC_SIMPLE"),
        
        # Opção 2: Especificando formato para evitar negociação falha
        ("libcamerasrc ! video/x-raw, format=RGB, width=640, height=480 ! videoconvert ! appsink", "LIBCAMERASRC_RGB"),
        
        # Opção 3: V4L2 (apenas se o driver legado estiver ativo ou via v4l2-compat)
        ("v4l2src ! video/x-raw, width=640, height=480 ! videoconvert ! appsink", "V4L2_SRC"),
        
        # Opção 4: Backend ANY
        (0, "CV2_CAP_ANY")
    ]
    
    cap = None
    for pipe, nome in pipelines:
        print(f"\n--- Testando Fonte: {nome} ---")
        try:
            if isinstance(pipe, str):
                cap = cv2.VideoCapture(pipe, cv2.CAP_GSTREAMER)
            else:
                cap = cv2.VideoCapture(pipe)
            
            if cap.isOpened():
                print(f"Sucesso ao abrir: {nome}")
                # Testa leitura de 1 frame
                ret, frame = cap.read()
                if ret:
                    print(f"Frame capturado com sucesso ({frame.shape})!")
                    break
                else:
                    print(f"Falha ao ler frame do backend: {nome}")
                    cap.release()
                    cap = None
            else:
                print(f"Falha ao abrir backend: {nome}")
                cap = None
        except Exception as e:
            print(f"Erro no backend {nome}: {e}")
            cap = None

    if not cap or not cap.isOpened():
        print("\n[ERRO FATAL] Nenhuma fonte de vídeo funcionou.")
        return

    print("Iniciando loop de vídeo...")
    rodando = True
    while rodando:
        for event in pygame.event.get():
            if event.type == pygame.QUIT or event.type == pygame.KEYDOWN:
                rodando = False

        ret, frame = cap.read()
        if not ret:
            print("Perca de frame!")
            continue

        # Converter e exibir
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Resize para garantir que cabe no Pygame surf
        h, w, _ = frame_rgb.shape
        img = pygame.image.frombuffer(frame_rgb.tobytes(), (w, h), 'RGB')
        img = pygame.transform.scale(img, (LARGURA_TELA, ALTURA_TELA))
        
        tela.blit(img, (0, 0))
        txt = fonte.render("Visão CSI Ativa - Pressione qualquer tecla", True, (0, 255, 0))
        tela.blit(txt, (20, 20))
        
        pygame.display.flip()

    cap.release()
    pygame.quit()

if __name__ == "__main__":
    testar()
