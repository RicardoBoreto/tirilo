#!/usr/bin/env python3
import os
import cv2
import pygame
import sys
import traceback
import random
import time

# 1. Configurar Caminhos
PASTA_FERRAMENTA = os.path.dirname(os.path.abspath(__file__))
PASTA_ROBO = os.path.dirname(PASTA_FERRAMENTA)  # robo_tirilo/
sys.path.insert(0, PASTA_ROBO)

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

# Resolução
LARGURA_TELA, ALTURA_TELA = 800, 480
LARGURA_CAM, ALTURA_CAM = 640, 480

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
        w, h = info.current_w, info.current_h
        tela = pygame.display.set_mode((w, h), pygame.FULLSCREEN)
    except Exception:
        tela = pygame.display.set_mode((LARGURA_TELA, ALTURA_TELA), pygame.FULLSCREEN)
    return tela

def main():
    print(f"--- TIRILO VISÃO INICIANDO ---")
    print(f"PICAMERA2_ATIVO: {PICAMERA2_ATIVO}")
    print(f"Caminho XML: {HAAR_PATH} (Existe: {os.path.exists(HAAR_PATH)})")

    tela = iniciar_pygame()
    fonte = pygame.font.Font(None, 36)
    
    # Inicia Hardware
    olhos = None
    if ControladorOlhos:
        try:
            print("Iniciando motores (olhos)...")
            olhos = ControladorOlhos()
            olhos.olhar_neutro()
            time.sleep(0.5)
            olhos.fechar_palpebra("olho_direito", 30)
            olhos.fechar_palpebra("olho_esquerdo", 30)
        except Exception as e:
            print(f"Erro ao ligar motores: {e}")

    # Inicia Câmera (Lógica idêntica ao debug que funcionou)
    cap = None
    if PICAMERA2_ATIVO:
        try:
            print("Tentando Picamera2...")
            cap = Picamera2()
            config = cap.create_video_configuration(main={"size": (LARGURA_CAM, ALTURA_CAM), "format": "BGR888"})
            cap.configure(config)
            cap.start()
            print("Câmera CSI ligada (Formato BGR888)")
        except Exception as e:
            print(f"Falha na Picamera2: {e}")
            cap = None

    if not cap:
        print("Tentando OpenCV/USB...")
        cap = cv2.VideoCapture(0)

    # Carrega IA
    face_cascade = cv2.CascadeClassifier(HAAR_PATH)
    if face_cascade.empty():
        print("ERRO CRÍTICO: Não consegui carregar o modelo Haar Cascade!")
        return

    clock = pygame.time.Clock()
    rodando = True

    # Botão SAIR (canto superior direito, grande para touchscreen)
    W, H = tela.get_width(), tela.get_height()
    btn_sair = pygame.Rect(W - 140, 10, 130, 60)
    fonte_btn = pygame.font.Font(None, 48)

    # Variáveis para suavização de movimento (Filtro Passa-Baixa + Estabilização)
    last_x, last_y = 50.0, 50.0
    alpha = 0.15 # Movimento mais orgânico e lento
    limite_salto = 35.0 # Se pular mais de 35% de uma vez, ignora (provável erro)
    frames_sem_rosto = 0
    next_blink = time.time() + random.uniform(2, 6)

    while rodando:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: rodando = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE: rodando = False
            if event.type == pygame.MOUSEBUTTONDOWN and btn_sair.collidepoint(event.pos): rodando = False
            if event.type == pygame.FINGERDOWN:
                fx, fy = int(event.x * W), int(event.y * H)
                if btn_sair.collidepoint(fx, fy): rodando = False

        frame_raw = None
        try:
            if PICAMERA2_ATIVO and isinstance(cap, Picamera2):
                frame_raw = cap.capture_array()
            elif cap:
                ret, frame = cap.read()
                if ret: frame_raw = frame
        except Exception as e:
            print(f"Erro na captura: {e}")

        if frame_raw is not None:
            try:
                # 1. Preparar para IA (Otimização Extrema de Detecção)
                fator_escala = 2
                pequeno = cv2.resize(frame_raw, (LARGURA_CAM // fator_escala, ALTURA_CAM // fator_escala))
                gray = cv2.cvtColor(pequeno, cv2.COLOR_BGR2GRAY)
                
                # CLAHE: Muito superior ao equalizeHist para rostos em luz difícil
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                gray = clahe.apply(gray)
                
                # 2. Detecção
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

                # 3. Desenho e Rastreamento
                frame_display = frame_raw 

                if len(faces) > 0:
                    frames_sem_rosto = 0
                    # Pegar a maior face detectada
                    maior_face = max(faces, key=lambda f: f[2] * f[3])
                    (x_p, y_p, w_p, h_p) = maior_face
                    
                    # Converter coordenadas de volta para o frame original
                    x, y, w, h = x_p * fator_escala, y_p * fator_escala, w_p * fator_escala, h_p * fator_escala
                    
                    cv2.rectangle(frame_display, (x, y), (x+w, y+h), (0, 255, 0), 4)
                    
                    if olhos:
                        cx = x + w//2
                        cy = y + h//2
                        alvo_x = 100 - (cx / LARGURA_CAM * 100)
                        alvo_y = (cy / ALTURA_CAM * 100)
                        
                        # FILTRO ANTI-SALTO: Se a diferença for absurda, é um erro de detecção
                        diff_x = abs(alvo_x - last_x)
                        diff_y = abs(alvo_y - last_y)
                        
                        if diff_x < limite_salto and diff_y < limite_salto:
                            # APLICAR SUAVIZAÇÃO
                            last_x = (alvo_x * alpha) + (last_x * (1.0 - alpha))
                            last_y = (alvo_y * alpha) + (last_y * (1.0 - alpha))
                            olhos.olhar_para(last_x, last_y)
                        else:
                            print(f"Pulo ignorado: DX={diff_x:.1f} DY={diff_y:.1f}")
                else:
                    frames_sem_rosto += 1
                    # Se ficar mais de 1 segundo sem ver ninguém, volta pro centro devagar
                    if frames_sem_rosto > 20:
                        last_x = (50.0 * 0.05) + (last_x * 0.95)
                        last_y = (50.0 * 0.05) + (last_y * 0.95)
                        if olhos: olhos.olhar_para(last_x, last_y)

                # 4. Mostrar no Pygame (Em Preto e Branco para feedback)
                # BGR2GRAY + converter para RGB (canais iguais) para exibição
                img_bw = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
                img_pygame = pygame.image.frombuffer(img_bw.tobytes(), (LARGURA_CAM // fator_escala, ALTURA_CAM // fator_escala), 'RGB')
                img_pygame = pygame.transform.flip(img_pygame, True, False) # Espelho
                img_pygame = pygame.transform.scale(img_pygame, (LARGURA_TELA, ALTURA_TELA))

                tela.blit(img_pygame, (0, 0))
                
                # Texto informativo
                txt = fonte.render(f"Faces: {len(faces)}", True, (0, 255, 0))
                tela.blit(txt, (20, 20))

                # Botão SAIR
                pygame.draw.rect(tela, (180, 0, 0), btn_sair, border_radius=10)
                pygame.draw.rect(tela, (255, 80, 80), btn_sair, 2, border_radius=10)
                txt_sair = fonte_btn.render("SAIR", True, (255, 255, 255))
                tela.blit(txt_sair, txt_sair.get_rect(center=btn_sair.center))

                pygame.display.flip()

                # 5. Piscada Espontânea (Efeito Humano)
                if time.time() > next_blink:
                    if olhos: olhos.piscar()
                    next_blink = time.time() + random.uniform(3, 8)

            except Exception as e:
                print(f"Erro no processamento: {e}")
                traceback.print_exc()
        
        clock.tick(20) # 20 FPS para manter estabilidade igual ao debug

    # Encerra
    if PICAMERA2_ATIVO and isinstance(cap, Picamera2): cap.stop()
    elif cap: cap.release()
    pygame.quit()

if __name__ == "__main__":
    main()
