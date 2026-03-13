#!/usr/bin/env python3
import os
import cv2
import sys
import time
import random
import traceback

# 1. Configurar Caminhos
PASTA_ROBO = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PASTA_ROBO)

HAAR_PATH = os.path.join(PASTA_ROBO, "haarcascades", "haarcascade_frontalface_default.xml")

try:
    from olhos_tirilo import ControladorOlhos
except ImportError:
    ControladorOlhos = None

try:
    from picamera2 import Picamera2
    PICAMERA2_ATIVO = True
except ImportError:
    PICAMERA2_ATIVO = False

# Resolução de Captura
LARGURA_CAM, ALTURA_CAM = 640, 480

def main():
    print(f"--- TIRILO RASTREADOR HEADLESS (SEM TELA) ---")
    print(f"PICAMERA2_ATIVO: {PICAMERA2_ATIVO}")
    print(f"Caminho XML: {HAAR_PATH} (Existe: {os.path.exists(HAAR_PATH)})")

    # Inicia Hardware (Motores)
    olhos = None
    if ControladorOlhos:
        try:
            print("Iniciando motores (olhos)...")
            olhos = ControladorOlhos()
            olhos.olhar_neutro()
        except Exception as e:
            print(f"Erro ao ligar motores: {e}")

    # Inicia Câmera
    cap = None
    if PICAMERA2_ATIVO:
        try:
            cap = Picamera2()
            config = cap.create_video_configuration(main={"size": (LARGURA_CAM, ALTURA_CAM), "format": "BGR888"})
            cap.configure(config)
            cap.start()
            print("Câmera CSI ligada.")
        except Exception as e:
            print(f"Falha na Picamera2: {e}")
            cap = None

    if not cap:
        print("Tentando OpenCV/USB...")
        cap = cv2.VideoCapture(0)

    # Carrega IA
    face_cascade = cv2.CascadeClassifier(HAAR_PATH)
    if face_cascade.empty():
        print("ERRO CRÍTICO: Modelo Haar Cascade não encontrado!")
        return

    # Variáveis de Suavização e Estado
    last_x, last_y = 50.0, 50.0
    alpha = 0.15 # Suavização orgânica
    limite_salto = 35.0
    frames_sem_rosto = 0
    next_blink = time.time() + random.uniform(2, 6)
    
    print("\n[TIRILO] Rastreamento em execução em segundo plano...")
    print("Pressione Ctrl+C para encerrar.")

    try:
        while True:
            frame_raw = None
            if PICAMERA2_ATIVO and isinstance(cap, Picamera2):
                frame_raw = cap.capture_array()
            elif cap:
                ret, frame = cap.read()
                if ret: frame_raw = frame

            if frame_raw is not None:
                # 1. Processamento (Otimização de Contraste CLAHE)
                fator_escala = 2
                pequeno = cv2.resize(frame_raw, (LARGURA_CAM // fator_escala, ALTURA_CAM // fator_escala))
                gray = cv2.cvtColor(pequeno, cv2.COLOR_BGR2GRAY)
                
                # CLAHE: Melhora o contraste local sem estourar a imagem
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                gray = clahe.apply(gray)
                
                # 2. Detecção
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

                if len(faces) > 0:
                    frames_sem_rosto = 0
                    maior_face = max(faces, key=lambda f: f[2] * f[3])
                    (x_p, y_p, w_p, h_p) = maior_face
                    
                    # Converter para coordenadas reais
                    x, y = x_p * fator_escala, y_p * fator_escala
                    w, h = w_p * fator_escala, h_p * fator_escala
                    
                    if olhos:
                        cx, cy = x + w//2, y + h//2
                        alvo_x = 100 - (cx / LARGURA_CAM * 100)
                        alvo_y = (cy / ALTURA_CAM * 100)
                        
                        # Filtro Anti-Salto
                        if abs(alvo_x - last_x) < limite_salto and abs(alvo_y - last_y) < limite_salto:
                            last_x = (alvo_x * alpha) + (last_x * (1.0 - alpha))
                            last_y = (alvo_y * alpha) + (last_y * (1.0 - alpha))
                            olhos.olhar_para(last_x, last_y)
                else:
                    frames_sem_rosto += 1
                    if frames_sem_rosto > 20: # ~1 segundo
                        # Volta ao centro suavemente
                        last_x = (50.0 * 0.05) + (last_x * 0.95)
                        last_y = (50.0 * 0.05) + (last_y * 0.95)
                        if olhos: olhos.olhar_para(last_x, last_y)

                # 3. Piscada espontânea
                if time.time() > next_blink:
                    if olhos: olhos.piscar()
                    next_blink = time.time() + random.uniform(3, 8)

            # Controla a taxa de processamento (economiza CPU)
            time.sleep(0.05) # ~20 FPS

    except KeyboardInterrupt:
        print("\nEncerrando rastreador...")
    except Exception as e:
        print(f"Erro inesperado: {e}")
        traceback.print_exc()
    finally:
        if PICAMERA2_ATIVO and isinstance(cap, Picamera2): cap.stop()
        elif cap: cap.release()

if __name__ == "__main__":
    main()
