#!/usr/bin/env python3
import os
import cv2
import time
import threading
from olhos_tirilo import ControladorOlhos

# ==========================================
# CONFIGURAÇÕES DO RASTREADOR (CEGO - OTIMIZADO)
# ==========================================
# Para o Pi 3, a menor resolução possível da webcam poupa CPU
LARGURA_CAM = 320 
ALTURA_CAM = 240
# Pode deixar baixo, pois os motores não reagem em 60hz, basta acompanhar
FPS_CAM = 10 

HAAR_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "haarcascades", "haarcascade_frontalface_default.xml")

print("Inicializando Controlador de Olhos...")
try:
    olhos = ControladorOlhos()
    olhos.olhar_neutro(suave=False)
except Exception as e:
    print(f"Erro ao inicializar ControladorOlhos: {e}")
    olhos = None

alvo_atual = {"x": 50.0, "y": 50.0}
rodando = True
rosto_detectado = False

def traduzir_coordenada(pixels, min_pixel, max_pixel, min_saida=0, max_saida=100):
    p = max(min_pixel, min(max_pixel, pixels))
    proporcao = (p - min_pixel) / float(max_pixel - min_pixel)
    return min_saida + (proporcao * (max_saida - min_saida))

def thread_motores():
    global alvo_atual, rodando, olhos, rosto_detectado
    if olhos is None: return
        
    ultima_atualizacao = time.time()
    
    while rodando:
        tempo_atual = time.time()
        # Envia comando de servo a cada 50ms para manter o I2C limpo
        if tempo_atual - ultima_atualizacao > 0.05:
            if rosto_detectado:
                # Usa os eixos diretos conforme testado no hardware
                x_servo = alvo_atual["x"]
                y_servo = alvo_atual["y"]
            else:
                # Suaviza a volta pro centro se perder o rosto
                alvo_atual["x"] += (50.0 - alvo_atual["x"]) * 0.1
                alvo_atual["y"] += (50.0 - alvo_atual["y"]) * 0.1
                x_servo = alvo_atual["x"]
                y_servo = alvo_atual["y"]

            olhos.virar_olho("olho_direito", x_servo, y_servo)
            olhos.virar_olho("olho_esquerdo", x_servo, y_servo)
            ultima_atualizacao = tempo_atual
        
        time.sleep(0.01)

def iniciar_rastreamento():
    global alvo_atual, rodando, rosto_detectado
    
    if not os.path.exists(HAAR_PATH):
        print("Execute python3 setup_visao.py primeiro.")
        return

    t_motores = threading.Thread(target=thread_motores)
    t_motores.start()

    face_cascade = cv2.CascadeClassifier(HAAR_PATH)

    print("Iniciando Câmera USB no Modo CEGO (Alta Performance)...")
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, LARGURA_CAM)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, ALTURA_CAM)
    cap.set(cv2.CAP_PROP_FPS, FPS_CAM)

    if not cap.isOpened():
        print("Nenhuma câmera encontrada.")
        rodando = False
        t_motores.join()
        return

    print("==================================================")
    print(" RASTREAMENTO ATIVO (Pressione CTRL+C para Sair!) ")
    print("==================================================")

    # Contador para não poluir o terminal de print o tempo todo
    contador_log = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break

            # Espelha pro robô olhar do lado certo da imagem capturada de frente
            frame = cv2.flip(frame, 1)
            # Imagem pura em cinza basta pro OpenCV achar o rosto
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            faces = face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.2, 
                minNeighbors=5, 
                minSize=(60, 60), 
                flags=cv2.CASCADE_SCALE_IMAGE
            )

            if len(faces) > 0:
                rosto_detectado = True
                faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)
                (x, y, w, h) = faces[0]
                
                centro_x = x + (w // 2)
                centro_y = y + (h // 2)
                
                px = traduzir_coordenada(centro_x, 0, LARGURA_CAM, 0, 100)
                py = traduzir_coordenada(centro_y, 0, ALTURA_CAM, 0, 100)
                
                alvo_atual["x"] = px
                alvo_atual["y"] = py
                
                contador_log += 1
                if contador_log % 5 == 0:
                    # Print reduzido pra não comer CPU até no Log
                    print(f"[ALVO DETECTADO] Servos -> X: {int(px)}% | Y: {int(py)}%")
            else:
                rosto_detectado = False

    except KeyboardInterrupt:
        print("\nDesligando...")
    
    finally:
        rodando = False
        cap.release()
        t_motores.join()
        if olhos:
            olhos.olhar_neutro(suave=False)
        print("Sistema finalizado.")

if __name__ == "__main__":
    iniciar_rastreamento()
