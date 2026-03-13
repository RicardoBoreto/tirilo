import cv2
import threading
from flask import Flask, Response
import time

app = Flask(__name__)
# Frame global que será compartilhado entre a Leitura da Câmera e o Servidor Web
frame_global = None
lock = threading.Lock()

def gerar_frames_web():
    """Gerador que transforma frames numpy da Câmera USB em formato JPEG para a Web"""
    global frame_global
    while True:
        with lock:
            if frame_global is None:
                # Se não tem imagem ainda, dorme um pouquinho pra não torrar CPU atoa
                time.sleep(0.1)
                continue
            
            # Converte o frame atual renderizado do CV2 para formato imagem JPEG compactada
            ret, buffer = cv2.imencode('.jpg', frame_global)
            frame_bytes = buffer.tobytes()

        # Monta a estrutura Multipart que os navegadores (Chrome/Safari) entendem como Stream de Vídeo
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video')
def video_feed():
    """Rota que entrega o Stream HTML da câmera para a página"""
    return Response(gerar_frames_web(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    """Página raiz básica só pra mostrar o player"""
    return '''
    <html>
      <head>
        <title>Tirilo - Visão Mágica</title>
        <style>
          body { background-color: #111; color: white; text-align: center; font-family: sans-serif; }
          img { border: 3px solid #333; border-radius: 10px; max-width: 100%; box-shadow: 0 0 20px rgba(0,255,0,0.2); }
        </style>
      </head>
      <body>
        <h1>Câmera do Tirilo</h1>
        <p>Acompanhando alvos em tempo real</p>
        <img src="/video" />
      </body>
    </html>
    '''

def servidor_flask():
    # Roda o servidor web silenciosamente (sem muito log poluindo terminal)
    # 0.0.0.0 garante que pode ser acessado em qualquer IP da rede local
    app.run(host='0.0.0.0', port=5000, threaded=True, use_reloader=False)

# Vamos chamar isso a partir do script original
def iniciar_servidor_web():
    th = threading.Thread(target=servidor_flask)
    th.daemon = True # Morre junto quando apertar Ctrl+C
    th.start()
    print("\n=======================================================")
    print(" SERVIDOR DE VÍDEO ATIVO! ")
    print(" Abra no navegador do PC a URL: http://<IP_DO_RASPBERRY>:5000")
    print("=======================================================\n")
