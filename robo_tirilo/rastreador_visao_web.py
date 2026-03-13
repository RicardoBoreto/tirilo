#!/usr/bin/env python3
import os
import cv2
import time
import threading

# Força o uso do monitor conectado ao Raspberry Pi, mesmo se executado via SSH
if os.environ.get('DISPLAY') is None:
    os.environ['DISPLAY'] = ':0'

from olhos_tirilo import ControladorOlhos
import servidor_camera

# ==========================================
# CONFIGURAÇÕES DO RASTREADOR COM WEB STREAM
# ==========================================
LARGURA_CAM = 320 # Menor resolução = Inferência MUITO mais veloz 
ALTURA_CAM = 240
FPS_CAM = 15 # Reduzido para dar tempo do Haar cascade respirar

# Caminho para o Haar Cascade de Rosto (que baixamos com o setup_visao.py)
HAAR_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "haarcascades", "haarcascade_frontalface_default.xml")

# Inicializa o Controlador dos Olhos do Tirilo
print("Inicializando Controlador de Olhos...")
try:
    olhos = ControladorOlhos()
    # Garante que ele acorda neutro
    olhos.olhar_neutro(suave=False)
except Exception as e:
    print(f"Erro ao inicializar ControladorOlhos: {e}")
    olhos = None

# Variáveis globais para compartilhar entre a thread da Câmera e a Thread do PCA9685
# para evitar que o I2C/Serial trave tentando acompanhar fps altos demais
alvo_atual = {"x": 50.0, "y": 50.0}
rodando = True

def traduzir_coordenada(pixels, min_pixel, max_pixel, min_saida=0, max_saida=100):
    """ Mapeia a posição em Pixels (ex: X do Rosto na tela) para Graus percentuais (0-100) """
    # 1. Garante que os limites sejam respeitados
    p = max(min_pixel, min(max_pixel, pixels))
    
    # 2. Calcula a proporção
    proporcao = (p - min_pixel) / float(max_pixel - min_pixel)
    
    # 3. Mapeia para 0-100
    return min_saida + (proporcao * (max_saida - min_saida))

def thread_motores():
    """ Thread dedicada apenas a enviar o comando I2C suave baseado no último alvo """
    global alvo_atual, rodando, olhos
    
    if olhos is None:
        print("THREAD MOTORES CANCELADA: Sem ControladorOlhos.")
        return
        
    ultima_atualizacao = time.time()
    
    while rodando:
        tempo_atual = time.time()
        # Envia comando de servo a cada 50ms para não congestionar o barramento I2C
        if tempo_atual - ultima_atualizacao > 0.05:
            # Pega o alvo traduzido para 0-100
            x_pct = alvo_atual["x"]
            y_pct = alvo_atual["y"]
            
            # Nota de design da Head:
            # - Quando X (pixel) = 0 (Esq tela), o robô tem que olhar para a sua ESQUERDA (100% no servokit)
            #   Para o robô que interage frente a frente, se a pessoa está à esquerda na imagem, 
            #   o servo horizontal tem que apontar em direção à pessoa.
            # O inverter eixo vai depender puramente do hardware. O Tirilo padrão precisa 
            # de X Invertido (espelhado).  
            # CORREÇÃO: Pelo teste de campo, 0% = Câmera esquerda, e o servo já aponta pra esquerda nativamente!
            x_servo = x_pct # Direto, sem inversão!
            
            # No eixo vertical
            # Camera Y=0 (Alto do rosto) -> Robô deve olhar para cima (100%)
            # Camera Y=480 (Chão) -> Robô deve olhar para baixo (0%)
            # CORREÇÃO: O eixo Y também é direto pelo hardware
            y_servo = y_pct

            # Manda atualizar os eixos simultâneos para manter o paralelismo dos 2 globos
            olhos.virar_olho("olho_direito", x_servo, y_servo)
            olhos.virar_olho("olho_esquerdo", x_servo, y_servo)
            
            ultima_atualizacao = tempo_atual
        
        # Dorme um pouco
        time.sleep(0.01)

def iniciar_rastreamento():
    global alvo_atual, rodando
    
    if not os.path.exists(HAAR_PATH):
        print(f"Erro: Arquivo Haar Cascade não encontrado em {HAAR_PATH}")
        print("execute o comando: python3 setup_visao.py para baixar o modelo.")
        return

    # Inicia a thread dos olhos
    t_motores = threading.Thread(target=thread_motores)
    t_motores.start()

    # Inicializa detecção de rostos
    face_cascade = cv2.CascadeClassifier(HAAR_PATH)

    # Inicia Câmera
    print("Iniciando Câmera USB...")
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, LARGURA_CAM)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, ALTURA_CAM)
    cap.set(cv2.CAP_PROP_FPS, FPS_CAM)

    if not cap.isOpened():
        print("Nenhuma câmera encontrada na porta 0.")
        rodando = False
        t_motores.join()
        return

    # Inicia o Servidor de Stream Web numa Thread Paralela
    servidor_camera.iniciar_servidor_web()

    print("=======================================")
    print(" STREAM DE VÍDEO ATIVO! (APERTE CTRL+C PARA SAIR) ")
    print("=======================================")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Falha ao ler o frame da câmera.")
                break

            # 1. Flip no frame pra agilizar para quem está olhando a própria tela 
            # (Modo espelho mágico) e converte pra escala de cinza para perfomance
            frame = cv2.flip(frame, 1)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # 2. Detectar Rosto 
            # Opções de otimização de CPU para SBC - Scale factor menor = mais rápido, mas menos exato
            faces = face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.2, 
                minNeighbors=5, 
                minSize=(60, 60), 
                flags=cv2.CASCADE_SCALE_IMAGE
            )

            # Se encontrou ao menos 1 rosto, pega o primeiro, ou o maior.
            if len(faces) > 0:
                # Opcional: ordenar as faces por tamanho para focar no rosto mais próximo da tela
                faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)
                (x, y, w, h) = faces[0]
                
                # Coordenada do centro do rosto detectado
                centro_x = x + (w // 2)
                centro_y = y + (h // 2)
                
                # Mapeia para % 0-100 para a thread dos servo motores usar
                px = traduzir_coordenada(centro_x, 0, LARGURA_CAM, 0, 100)
                py = traduzir_coordenada(centro_y, 0, ALTURA_CAM, 0, 100)
                
                alvo_atual["x"] = px
                alvo_atual["y"] = py

                # Desenha Retângulo e Ponto Central no Rosto Detectado
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.circle(frame, (centro_x, centro_y), 5, (0, 0, 255), -1)
                
                # Feedback de texto rápido na tela
                cv2.putText(frame, f"ALVO X:{int(px)}% Y:{int(py)}%", (x, y-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            else:
                # Se não tem rosto na câmera, a thread dos Motores recebe a instrução
                # de voltar devagar para o Centro (50%)
                alvo_atual["x"] = alvo_atual["x"] + (50.0 - alvo_atual["x"]) * 0.1
                alvo_atual["y"] = alvo_atual["y"] + (50.0 - alvo_atual["y"]) * 0.1
                cv2.putText(frame, "Procurando rosto...", (20, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # --- PARTE NOVA: Compartilha o frame modificado para o Servidor Web Ler ---
            with servidor_camera.lock:
                # Fazemos uma copia do frame pra Thread do OpenCV continuar solta
                # e pro usuário do PC conseguir ler via browser
                servidor_camera.frame_global = frame.copy()

    except KeyboardInterrupt:
        print("\nProcesso interrompido no Shell.")
    
    finally:
        # Libera recursos e para as threads
        rodando = False
        cap.release()
        cv2.destroyAllWindows()
        t_motores.join()
        if olhos:
            olhos.olhar_neutro(suave=False)
        print("Sistema finalizado.")

if __name__ == "__main__":
    iniciar_rastreamento()
