#!/usr/bin/env python3
import os
import cv2
import pygame
import numpy as np
import sys

try:
    from picamera2 import Picamera2
    PICAMERA2_ATIVO = True
except ImportError:
    PICAMERA2_ATIVO = False

# Configurações
LARGURA_TELA = 800
ALTURA_TELA = 480
LARGURA_CAM = 640
ALTURA_CAM = 480

MODOS_COR = [
    "RGB (Padrão)",
    "BGR (Invertido)",
    "RBG",
    "GRB",
    "GBR",
    "BRG",
    "Cinza (Garantia)"
]

HAAR_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "haarcascades", "haarcascade_frontalface_default.xml")

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

def processar_cor(frame, modo_idx):
    # Assume que o original é o que o Picamera2 entrega (tentamos BGR888 no config)
    if modo_idx == 0: # RGB
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    elif modo_idx == 1: # BGR
        return frame
    elif modo_idx == 2: # RBG
        return frame[:, :, [2, 0, 1]]
    elif modo_idx == 3: # GRB
        return frame[:, :, [1, 2, 0]]
    elif modo_idx == 4: # GBR
        return frame[:, :, [1, 0, 2]]
    elif modo_idx == 5: # BRG
        return frame[:, :, [0, 2, 1]]
    elif modo_idx == 6: # Cinza
        g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return cv2.cvtColor(g, cv2.COLOR_GRAY2RGB)
    return frame

def debug_camera():
    tela = iniciar_gui()
    fonte = pygame.font.Font(None, 28)
    
    cap = None
    if PICAMERA2_ATIVO:
        print("Iniciando Picamera2...")
        cap = Picamera2()
        config = cap.create_video_configuration(main={"size": (LARGURA_CAM, ALTURA_CAM), "format": "BGR888"})
        cap.configure(config)
        cap.start()
    else:
        print("Picamera2 não disponível, usando OpenCV...")
        cap = cv2.VideoCapture(0)

    face_cascade = cv2.CascadeClassifier(HAAR_PATH)
    
    modo_cor = 0
    sensibilidade = 1.1
    min_neighbors = 3
    rodando = True
    clock = pygame.time.Clock()

    print("\n--- COMANDOS DO DEBUG ---")
    print("TOQUE NA TELA ou ESPAÇO: Muda Modo de Cor")
    print("TECLAS UP/DOWN: Sobe/Desce Sensibilidade")
    print("TECLAS LEFT/RIGHT: Sobe/Desce Min Neighbors")
    print("TECLA ESC: Sair")

    while rodando:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: rodando = False
            if event.type == pygame.MOUSEBUTTONDOWN or event.type == pygame.FINGERDOWN:
                modo_cor = (modo_cor + 1) % len(MODOS_COR)
                print(f"Toque detectado! Mudando para: {MODOS_COR[modo_cor]}")
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE: rodando = False
                if event.key == pygame.K_SPACE:
                    modo_cor = (modo_cor + 1) % len(MODOS_COR)
                if event.key == pygame.K_UP: sensibilidade += 0.05
                if event.key == pygame.K_DOWN: sensibilidade = max(1.01, sensibilidade - 0.05)
                if event.key == pygame.K_RIGHT: min_neighbors += 1
                if event.key == pygame.K_LEFT: min_neighbors = max(1, min_neighbors - 1)

        frame_raw = None
        if PICAMERA2_ATIVO:
            frame_raw = cap.capture_array()
        else:
            ret, frame_raw = cap.read()

        if frame_raw is not None:
            # 1. Processar Cores para Display
            frame_display = processar_cor(frame_raw.copy(), modo_cor)
            
            # 2. Tentar Detecção (OpenCV prefere BGR ou Gray)
            gray = cv2.cvtColor(frame_raw, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=sensibilidade, minNeighbors=min_neighbors, minSize=(50, 50))

            # Desenha resultados
            for (x, y, w, h) in faces:
                # Se for cinza, desenhamos em branco, senão em verde
                cor_box = (0, 255, 0) if modo_cor != 6 else (255, 255, 255)
                cv2.rectangle(frame_display, (x, y), (x+w, y+h), cor_box, 3)

            # 3. Converter para Pygame
            img = pygame.image.frombuffer(frame_display.tobytes(), (LARGURA_CAM, ALTURA_CAM), 'RGB')
            img = pygame.transform.scale(img, (LARGURA_TELA, ALTURA_TELA))
            tela.blit(img, (0, 0))

            # Painel de Status
            infos = [
                f"Modo Cor: {MODOS_COR[modo_cor]} (TOQUE PARA MUDAR)",
                f"Sensibilidade (UP/DOWN): {sensibilidade:.2f}",
                f"Vizinhança (LEFT/RIGHT): {min_neighbors}",
                f"Rostos Detectados: {len(faces)}"
            ]
            
            y_offset = 20
            for info in infos:
                txt = fonte.render(info, True, (255, 255, 0))
                # Fundo preto para o texto
                pygame.draw.rect(tela, (0, 0, 0), (15, y_offset-2, txt.get_width()+10, 24))
                tela.blit(txt, (20, y_offset))
                y_offset += 28

            pygame.display.flip()
        
        clock.tick(20)

    if PICAMERA2_ATIVO: cap.stop()
    else: cap.release()
    pygame.quit()

if __name__ == "__main__":
    if not os.path.exists(HAAR_PATH):
        print(f"ERRO: {HAAR_PATH} não encontrado!")
    else:
        debug_camera()
