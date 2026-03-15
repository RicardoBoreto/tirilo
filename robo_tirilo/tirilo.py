#!/usr/bin/env python3
"""
=============================================================================
PROJETO: ROBÔ TIRILO
ARQUIVO: tirilo.py
VERSÃO:  4.6 (Voz Neural Terapeuta + Barge-In + Editor de Diretrizes)
DATA:    15/03/2026
AUTOR:   Ricardo Alonso Boreto

MUDANÇAS v4.5:
- VAD (Voice Activity Detection): gravação para automaticamente ao detectar silêncio
  (~1.3s após o usuário parar de falar) usando pyaudio + audioop, eliminando espera
  fixa de 4s. Fallback automático para arecord 4s se pyaudio não disponível.
- Pipeline TTS sem arquivo: espeak-ng --stdout piped diretamente ao aplay, eliminando
  gravação e leitura de arquivo WAV temporário.
- Gemini streaming: perguntar_gemini() usa generate_content_stream; cada frase é
  falada assim que chega, em paralelo com a geração do restante da resposta.
  Som de pensamento ("Ummm") roda em paralelo com o início do stream.
- Cache de diretriz IA: ler_diretriz_ia() armazena resultado em memória por 5 min,
  eliminando query Supabase a cada interação.
- Removidos time.sleep(0.3) e time.sleep(0.5) desnecessários em perguntar_gemini().

MUDANÇAS v4.4 (histórico):
- JOGO_PAREAR agora executa parearcor.py como subprocesso (display KMS exclusivo),
  mantendo rastreamento facial ativo durante o jogo.
- Piscada espontânea natural (piscar_natural): pálpebra superior fecha completamente,
  inferior sobe levemente — intervalo aleatório de 6 a 16 segundos, dupla piscada
  com 15% de chance. Pausa automática durante programas externos.
- Rastreamento facial melhorado: scaleFactor 1.1→1.05, minNeighbors 5→4, frame rate
  20 FPS efetivos (timing baseado em clock, não sleep fixo).
- Subprocessos (CALIBRAR_OLHOS, RASTREADOR_TELA, COREOGRAFIAS, JOGO_PAREAR) usam
  Popen com referência global _processo_externo — comando PARAR os encerra
  imediatamente via terminate().
- Câmera liberada corretamente ao pausar VisaoThread: stop() + close() no Picamera2.

MUDANÇAS v4.3 (histórico):
- Latência Zero: via expressa de áudio local, reação instantânea.
- Pálpebras Independentes: mecânica de semicerrar ao olhar para cima.
- Voz Robótica Clássica: espeak-ng como voz primária.
- Comandos SaaS: JOGAR_CORES, JOGAR_EMOCOES, MODO_PAPAGAIO, MODO_CONVERSA,
  JOGO_PAREAR, CALIBRAR, VISAO_TELA, PARAR, CALIBRAR_OLHOS, RASTREADOR_TELA,
  COREOGRAFIA_MACDONALD, COREOGRAFIA_SEULOBATO.
- Auto-start: serviço systemd para iniciar com o Raspberry Pi.
- Reporte de versão ao painel SaaS via heartbeat.
=============================================================================
"""

import os
import sys
import math
import re
import threading
import time
import subprocess
import random
import pygame
import queue
import speech_recognition as sr
import socket
from dotenv import load_dotenv
import asyncio
import edge_tts
from google import genai
from google.genai import types
import cv2
from olhos_tirilo import ControladorOlhos
from src.cloud import CloudManager

# --- 1. CONFIGURAÇÕES GLOBAIS ---
NOME_ROBO = "Tirilo"
VERSAO_ATUAL = "4.7"
AUTOR = "Ricardo Alonso Boreto"

# Configurações de Jogo
QTD_CHARADAS = 5 

DISPOSITIVO_AUDIO = "plughw:0,0"
ARQUIVO_REC = "/tmp/voz_usuario.wav"
ARQUIVO_TTS = "/tmp/resposta_robo.wav" # Alterado para WAV
DIR_BASE_SCRIPT = os.path.dirname(os.path.abspath(__file__))
# Mantém DIR_BASE para retrocompatibilidade em outros lugares
DIR_BASE = os.path.dirname(DIR_BASE_SCRIPT)
DIR_ASSETS = os.path.join(DIR_BASE_SCRIPT, "assets")
DIR_LOGS = os.path.join(DIR_BASE_SCRIPT, "logs") 
ARQUIVO_MUSICA = os.path.join(DIR_ASSETS, "musica.mp3")

# ARQUIVOS DE PERFIL E MODO
ARQUIVO_TERAPEUTA = os.path.join(DIR_BASE, "terapeuta.txt")
ARQUIVO_IA_CRIANCA = os.path.join(DIR_BASE, "ia_crianca.txt")
ARQUIVO_IA_TERAPEUTA = os.path.join(DIR_BASE, "ia_terapeuta.txt")

NOME_TERAPEUTA = "Terapeuta" # Valor padrão, será lido ou substituído
MODO_ROBO_ATUAL = "CRIANCA" # Pode ser "CRIANCA" ou "TERAPEUTA"
TEXTO_RESPOSTA_IA = "" # Variável global para exibição na tela
MODO_VISAO_TELA = False # Se True, mostra o frame da câmera na tela
FRAME_CAMERA = None # Armazena o último frame para o Pygame

# Configurações do Espeak
ESPEAK_VOZ = "pt-br"
ESPEAK_VELOCIDADE = "140" # Ajuste conforme necessário (padrão ~160 é rápido)
ESPEAK_PITCH = "50"       # Tom da voz (50 é padrão)

# Cores
PRETO = (0, 0, 0); BRANCO = (255, 255, 255); AZUL = (0, 120, 255)
VERDE = (0, 255, 0); VERMELHO = (255, 50, 50); AMARELO = (255, 200, 0)
AZUL_FORTE = (0, 0, 255); CINZA = (50, 50, 50); ROXO = (180, 0, 255)
AZUL_TRISTE = (0, 0, 100); ROXO_ESCURO = (50, 0, 80)
AZUL_ESPECIAL = (0, 50, 100) # Cor para o modo Doutor Tirilo

# Memória
HISTORICO_ANIMAIS = []

# IA
MODELO_IA = "gemini-2.5-flash"
cloud_mgr = None

# Cache de diretriz IA — evita query Supabase a cada interação
_cache_diretriz: dict = {}   # {modo: (texto, timestamp)}
_CACHE_DIRETRIZ_TTL = 300    # 5 minutos
_jogos_disponiveis: list = []  # Carregado do Supabase: [{nome, codigo, descricao}]


# --- INICIALIZAÇÃO DE ARQUIVOS ---
def configurar_arquivos_terapeuta():
    """Garante que o arquivo do terapeuta exista e carrega o nome."""
    global NOME_TERAPEUTA
    if not os.path.exists(DIR_LOGS): os.makedirs(DIR_LOGS)
    
    # Configura NOME_TERAPEUTA
    if not os.path.exists(ARQUIVO_TERAPEUTA):
        try:
            with open(ARQUIVO_TERAPEUTA, "w") as f:
                f.write("Ricardo") # Grava o nome inicial
            NOME_TERAPEUTA = "Ricardo"
        except Exception as e:
            print(f"Erro ao criar arquivo do terapeuta: {e}")
            NOME_TERAPEUTA = "Terapeuta"
    else:
        try:
            with open(ARQUIVO_TERAPEUTA, "r") as f:
                NOME_TERAPEUTA = f.read().strip() or "Terapeuta"
        except:
            NOME_TERAPEUTA = "Terapeuta"
            
def configurar_arquivos_diretriz():
    """Cria os arquivos de diretriz se não existirem."""
    
    # 1. Diretriz para Criança
    diretriz_crianca = f"""
Você é o Robô {NOME_ROBO}. Fale com uma criança.
Seu objetivo é ajudar no desenvolvimento de crianças atípicas com TEA ou qualquer Neurodivergência.
Siga sempre estas regras de diálogo:
1. Elogie a criança.
2. Responda curto e com clareza.
3. Termine sempre com uma pergunta para engajamento.

Jogos disponíveis — você pode sugerir e iniciar um jogo quando a criança quiser brincar ou quando for terapêuticamente adequado:
- cores: jogo das cores (toca na cor certa)
- emocoes: jogo das emoções (identifica a emoção mostrada)
- adivinhacao: jogo de charadas de animais
- musica: tocar música e dançar
- parear: jogo de parear cores (arrastar e soltar)

Para iniciar um jogo, inclua a tag [JOGO:codigo] no final da sua resposta. Exemplos:
  "Vamos brincar! [JOGO:cores]"
  "Que tal um jogo de emoções? [JOGO:emocoes]"
Nunca mencione a tag em voz alta — ela será removida automaticamente.
"""
    # Atualiza o arquivo se não existir OU se não tiver as instruções de jogo
    _precisa_atualizar = not os.path.exists(ARQUIVO_IA_CRIANCA)
    if not _precisa_atualizar:
        try:
            with open(ARQUIVO_IA_CRIANCA, "r") as f:
                if "[JOGO:" not in f.read():
                    _precisa_atualizar = True
        except: _precisa_atualizar = True
    if _precisa_atualizar:
        try:
            with open(ARQUIVO_IA_CRIANCA, "w") as f:
                f.write(diretriz_crianca.strip())
            print(f"Diretriz criança atualizada: {ARQUIVO_IA_CRIANCA}")
        except: pass
        
    # 2. Diretriz para Terapeuta
    diretriz_terapeuta = f"""
Você é o Doutor {NOME_ROBO}, uma interface de inteligência artificial para análise comportamental.
Seu objetivo principal é auxiliar o terapeuta no desenvolvimento de crianças atípicas com TEA ou Neurodivergência.
Você está conversando com o terapeuta {NOME_TERAPEUTA}. Seu tom deve ser profissional, conciso e focado em dados, configurações e análise comportamental.
Não use emojis ou linguagem infantil.
"""
    if not os.path.exists(ARQUIVO_IA_TERAPEUTA):
        try:
            with open(ARQUIVO_IA_TERAPEUTA, "w") as f:
                f.write(diretriz_terapeuta.strip())
        except: pass

def ler_diretriz_ia(modo):
    """Lê a diretriz de IA: cache em memória (5 min) → Supabase → arquivo local."""
    global _cache_diretriz
    agora = time.time()

    # 1. Cache em memória (evita query Supabase a cada interação)
    if modo in _cache_diretriz:
        texto_cache, ts = _cache_diretriz[modo]
        if agora - ts < _CACHE_DIRETRIZ_TTL:
            return texto_cache

    diretriz = None

    # 2. Tenta buscar via CloudManager (Supabase ou Cache Local)
    if cloud_mgr:
        diretriz = cloud_mgr.get_ai_directive(modo)

    # 3. Se falhar, lê o arquivo local
    if not diretriz:
        caminho = ARQUIVO_IA_TERAPEUTA if modo == "TERAPEUTA" else ARQUIVO_IA_CRIANCA
        try:
            if os.path.exists(caminho):
                with open(caminho, "r") as f:
                    diretriz = f.read()
        except Exception as e:
            print(f"ERRO: Falha ao ler diretriz local para {modo}: {e}")

    # 4. Substitui placeholders e normaliza
    if diretriz:
        resultado = diretriz.replace("{NOME_ROBO}", NOME_ROBO).replace("{NOME_TERAPEUTA}", NOME_TERAPEUTA).strip()
    else:
        resultado = "Você é o robô Tirilo. Responda de forma curta e amigável."

    # 5. Armazena no cache
    _cache_diretriz[modo] = (resultado, agora)
    return resultado


# --- CONFIGURAÇÃO DE VISÃO ---
MODO_VISAO_ATIVO = True # Controla se o robô segue rostos
_ev_camera_livre = threading.Event() # Sinaliza que a câmera foi liberada
_pausar_piscar = False  # Pausa piscada espontânea durante animações complexas/programas externos
_parar_fala = threading.Event()  # Barge-in: interrompe fala ao detectar voz (modo Terapeuta)
_processo_externo = None  # Processo filho atual (jogo/programa externo) para poder encerrar via PARAR
HAAR_PATH = os.path.join(DIR_BASE, "robo_tirilo", "haarcascades", "haarcascade_frontalface_default.xml")

try:
    from picamera2 import Picamera2
    PICAMERA2_ATIVO = True
except ImportError:
    PICAMERA2_ATIVO = False

class VisaoThread(threading.Thread):
    def __init__(self, controlador_olhos):
        super().__init__()
        self.olhos = controlador_olhos
        self.running = True
        self.daemon = True
        self.cap = None
        self.last_x, self.last_y = 50.0, 50.0
        self.alpha = 0.15
        self.limite_salto = 35.0
        self.frames_sem_rosto = 0

    def run(self):
        if not self.olhos: return
        
        # Inicializa Câmera
        try:
            if PICAMERA2_ATIVO:
                self.cap = Picamera2()
                config = self.cap.create_video_configuration(main={"size": (640, 480), "format": "BGR888"})
                self.cap.configure(config)
                self.cap.start()
            else:
                self.cap = cv2.VideoCapture(0)
        except Exception as e:
            print(f"VisaoThread: Erro ao iniciar câmera: {e}")
            return

        face_cascade = cv2.CascadeClassifier(HAAR_PATH)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        INTERVALO_FRAME = 1.0 / 20  # 20 FPS alvo

        while self.running:
            t_inicio = time.time()
            if not MODO_VISAO_ATIVO:
                # Libera a câmera para que programas externos possam usá-la
                if self.cap is not None:
                    try:
                        if PICAMERA2_ATIVO and isinstance(self.cap, Picamera2):
                            self.cap.stop()
                            self.cap.close()  # Libera hardware completamente
                        else:
                            self.cap.release()
                    except: pass
                    self.cap = None
                    _ev_camera_livre.set()
                time.sleep(0.5)
                continue

            # Reabre a câmera se foi liberada
            if self.cap is None:
                try:
                    if PICAMERA2_ATIVO:
                        self.cap = Picamera2()
                        config = self.cap.create_video_configuration(main={"size": (640, 480), "format": "BGR888"})
                        self.cap.configure(config)
                        self.cap.start()
                    else:
                        self.cap = cv2.VideoCapture(0)
                except Exception as e:
                    print(f"VisaoThread: Erro ao reabrir câmera: {e}")
                    time.sleep(1)
                    continue

            frame = None
            try:
                if PICAMERA2_ATIVO and isinstance(self.cap, Picamera2):
                    frame = self.cap.capture_array()
                elif self.cap:
                    ret, f = self.cap.read()
                    if ret: frame = f
            except: pass

            if frame is not None:
                # Processamento P&B CLAHE
                pequeno = cv2.resize(frame, (320, 240))
                gray = cv2.cvtColor(pequeno, cv2.COLOR_BGR2GRAY)
                gray = clahe.apply(gray)
                
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=4, minSize=(30, 30))

                if len(faces) > 0:
                    self.frames_sem_rosto = 0
                    maior = max(faces, key=lambda f: f[2] * f[3])
                    (x_p, y_p, w_p, h_p) = maior
                    
                    cx = (x_p + w_p//2) * 2
                    cy = (y_p + h_p//2) * 2
                    
                    alvo_x = 100 - (cx / 640 * 100)
                    alvo_y = (cy / 480 * 100)
                    
                    if abs(alvo_x - self.last_x) < self.limite_salto and abs(alvo_y - self.last_y) < self.limite_salto:
                        self.last_x = (alvo_x * self.alpha) + (self.last_x * (1.0 - self.alpha))
                        self.last_y = (alvo_y * self.alpha) + (self.last_y * (1.0 - self.alpha))
                        self.olhos.olhar_para(self.last_x, self.last_y)
                else:
                    self.frames_sem_rosto += 1
                    if self.frames_sem_rosto > 20: # 1 sec
                        self.last_x = (50.0 * 0.05) + (self.last_x * 0.95)
                        self.last_y = (50.0 * 0.05) + (self.last_y * 0.95)
                        self.olhos.olhar_para(self.last_x, self.last_y)

                # Exporta frame para o GUI se o modo visão tela estiver ativo
                global FRAME_CAMERA, MODO_VISAO_TELA
                if MODO_VISAO_TELA and frame is not None:
                    try:
                        # Reduz para performance
                        f_small = cv2.resize(frame, (320, 240))
                        f_rgb = cv2.cvtColor(f_small, cv2.COLOR_BGR2RGB)
                        FRAME_CAMERA = pygame.image.frombuffer(f_rgb.tobytes(), (320, 240), 'RGB')
                    except: pass

            # Dorme apenas o tempo restante do frame para manter 20 FPS efetivos
            elapsed = time.time() - t_inicio
            restante = INTERVALO_FRAME - elapsed
            if restante > 0:
                time.sleep(restante)

        if PICAMERA2_ATIVO and self.cap: self.cap.stop()
        elif self.cap: self.cap.release()

def obter_ip_local(): 
    """Tenta obter o IP do dispositivo na rede. Retorna 'Não encontrado' em caso de erro."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)) 
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "Não encontrado"


# --- 2. HARDWARE (Controlador PCA9685) ---
olhos = None
HARDWARE_ATIVO = False

def inicializar_hardware():
    global olhos, HARDWARE_ATIVO
    try:
        print("Iniciando Controlador de Olhos/Boca (PCA9685)...")
        olhos = ControladorOlhos()
        olhos.olhar_neutro()
        
        HARDWARE_ATIVO = True
        print("Hardware PCA9685 ativado com sucesso.")
    except Exception as e:
        print(f"Erro ao ligar hardware: {e}")
        HARDWARE_ATIVO = False

# --- 3. IA ---
def configurar_gemini():
    global CLIENTE_GEMINI
    
    # 1. Carrega os arquivos .env
    # Prioridade para o .env dentro da pasta do robô (o que é sincronizado via SCP manualmente)
    path_env_robo = os.path.join(DIR_BASE_SCRIPT, ".env")
    path_env_local = os.path.join(DIR_BASE, ".env.local")
    
    if os.path.exists(path_env_robo):
        print(f"DEBUG: Carregando chaves de {path_env_robo}")
        load_dotenv(path_env_robo, override=True)
    elif os.path.exists(path_env_local):
        print(f"DEBUG: Carregando chaves de {path_env_local}")
        load_dotenv(path_env_local, override=True)
    
    chave = None
    # Lista de variáveis possíveis (GOOGLE_GEMINI_API_KEY do seu arquivo)
    for var in ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"]:
        val = os.getenv(var)
        if val and "your_" not in val.lower() and val.strip() != "":
            chave = val.strip()
            print(f"IA: Chave encontrada na variável '{var}' (Inicia com: {chave[:4]}...)")
            break
            
    if not chave:
        for p in [os.path.join(DIR_BASE_SCRIPT, "chave_gemini.txt"), "chave_gemini.txt"]:
            if os.path.exists(p):
                try:
                    with open(p, "r") as f:
                        chave = f.read().strip().replace('"', '').replace("'", "")
                        if chave: 
                            print(f"IA: Chave carregada de {p}")
                            break
                except: pass

    if chave:
        try:
            CLIENTE_GEMINI = genai.Client(api_key=chave)
            print("IA: Cérebro Gemini inicializado com sucesso!")
        except Exception as e:
            print(f"IA: Falha crítica: {e}")
            CLIENTE_GEMINI = None
    else:
        print("IA: !!! NENHUMA CHAVE ENCONTRADA !!!")
        print("Atenção: Coloque sua chave no arquivo .env dentro da pasta 'robo_tirilo' no seu PC.")

r = sr.Recognizer()

# --- 4. INTERFACE GRÁFICA (TELA 5" - 800x480) ---
class RoboInterface:
    def __init__(self):
        os.environ["SDL_MOUSEDRV"] = "evdev"
        os.environ["SDL_MOUSEDEV"] = "/dev/input/event3" 
        
        drivers = ['kmsdrm', 'fbcon', 'directfb', 'dummy']
        for d in drivers:
            if not os.getenv('SDL_VIDEODRIVER'): os.environ['SDL_VIDEODRIVER'] = d
            try: pygame.display.init(); break
            except: continue
        
        pygame.font.init()
        try:
            info = pygame.display.Info()
            self.w, self.h = info.current_w, info.current_h
            self.tela = pygame.display.set_mode((self.w, self.h), pygame.FULLSCREEN)
            pygame.mouse.set_visible(True) 
        except:
            self.w, self.h = 800, 480 
            self.tela = pygame.display.set_mode((self.w, self.h))
        
        self.fonte_grande = pygame.font.Font(None, 80)
        self.fonte_media = pygame.font.Font(None, 55)
        self.fonte_peq = pygame.font.Font(None, 40)
        self.fonte_jogo = pygame.font.Font(None, 100)
        self.fonte_gigante = pygame.font.Font(None, 200)
        self.fonte_charada = pygame.font.Font(None, 60)
        
        self.sprites = {}
        largura_alvo = int(self.w * 0.5) 
        altura_alvo = int(self.h * 0.35)
        
        nomes = ['fechada', 'media', 'aberta', 'triste', 'surpresa']
        for nome in nomes:
            try:
                path = os.path.join(DIR_ASSETS, f"boca_{nome}.png")
                if os.path.exists(path):
                    img = pygame.image.load(path).convert_alpha()
                    self.sprites[nome] = pygame.transform.smoothscale(img, (largura_alvo, altura_alvo))
            except: pass

        self.running = True
        self.sprite_atual = self.sprites.get('fechada')
        self.status_texto = ""; self.cor_status = CINZA
        self.exibindo_splash = True; self.msg_loading = "Iniciando..."
        self.endereco_ip = obter_ip_local() 
        self.modo_jogo = False; self.tipo_jogo = ""
        self.ultimo_toque = None
        self.cor_jogo = PRETO; self.texto_jogo = ""
        
        # MODO TERAPEUTA
        self.arquivos_listados = [] # Lista de arquivos para exibição
        self.offset_lista = 0 # Scroll da lista
        self.lista_ativa = False # Indica se a lista de arquivos está na tela
        self.texto_ia = ""
        # Sincronização para suspensão do display (programas externos como calibrador)
        self.suspenso = False
        self._ev_display_livre = threading.Event()
        self._ev_retomar = threading.Event()

        cx = self.w // 2
        self.pos_olho_y = int(self.h * 0.30)
        self.pos_boca_y = int(self.h * 0.70)
        self.raio_olho = int(self.w * 0.09)  
        distancia_olhos = int(self.w * 0.22)

        self.rect_olho_esq = pygame.Rect(cx - distancia_olhos - self.raio_olho, self.pos_olho_y - self.raio_olho, self.raio_olho*2, self.raio_olho*2)
        self.rect_olho_dir = pygame.Rect(cx + distancia_olhos - self.raio_olho, self.pos_olho_y - self.raio_olho, self.raio_olho*2, self.raio_olho*2)
        self.rect_boca = pygame.Rect(cx - (largura_alvo//2), self.pos_boca_y - (altura_alvo//2), largura_alvo, altura_alvo)
        
        self.rect_jogo_esq = pygame.Rect(0, 0, self.w // 2, self.h)
        self.rect_jogo_dir = pygame.Rect(self.w // 2, 0, self.w // 2, self.h)
        
        self.centro_olho_esq = (cx - distancia_olhos, self.pos_olho_y)
        self.centro_olho_dir = (cx + distancia_olhos, self.pos_olho_y)
        
        # Área de desenho do texto da IA na tela principal
        self.rect_texto_ia = pygame.Rect(self.w * 0.1, self.h * 0.05, self.w * 0.8, self.h * 0.45)


    def processar_toque(self, x, y):
        self.ultimo_toque = (x, y)
        
        # Lógica de toque para sair do modo Terapeuta (Apenas um toque na área principal)
        if MODO_ROBO_ATUAL == "TERAPEUTA" and not self.lista_ativa:
             threading.Thread(target=finalizar_modo_terapeuta).start()
             return

        if not self.modo_jogo and not self.status_texto.startswith("🎵"):
            if self.rect_boca.collidepoint(x, y): falar_prioridade("Essa é minha boca!")
            elif self.rect_olho_esq.collidepoint(x, y): falar_prioridade("Meu olho esquerdo!")
            elif self.rect_olho_dir.collidepoint(x, y): falar_prioridade("Meu olho direito!")

    def loop_renderizacao(self):
        clock = pygame.time.Clock()
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT: self.running = False
                if event.type == pygame.MOUSEBUTTONDOWN or event.type == pygame.FINGERDOWN:
                    if event.type == pygame.FINGERDOWN: x = int(event.x * self.w); y = int(event.y * self.h)
                    else: x, y = event.pos
                    if self.modo_jogo and self.tipo_jogo == "parear":
                        self.processar_toque_parear(x, y)
                    else:
                        threading.Thread(target=self.processar_toque, args=(x,y)).start()
                
                if (event.type == pygame.MOUSEBUTTONUP or event.type == pygame.FINGERUP) and self.modo_jogo and self.tipo_jogo == "parear":
                     if event.type == pygame.FINGERUP: x = int(event.x * self.w); y = int(event.y * self.h)
                     else: x, y = event.pos
                     self.processar_toque_parear(x, y, up=True)

                if (event.type == pygame.MOUSEMOTION or event.type == pygame.FINGERMOTION) and self.modo_jogo and self.tipo_jogo == "parear":
                    if event.type == pygame.FINGERMOTION: x = int(event.x * self.w); y = int(event.y * self.h)
                    else: x, y = event.pos
                    self.processar_toque_parear(x, y)
                if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE: self.running = False

            # Suspensão do display para programas externos (CALIBRAR_OLHOS, RASTREADOR_TELA etc)
            if self.suspenso:
                pygame.display.quit()
                self._ev_display_livre.set()
                self._ev_retomar.wait()
                self._ev_retomar.clear()
                self.suspenso = False
                os.environ.pop('SDL_VIDEODRIVER', None)
                for d in ['kmsdrm', 'fbcon', 'directfb', 'dummy']:
                    os.environ['SDL_VIDEODRIVER'] = d
                    try:
                        pygame.display.init()
                        info = pygame.display.Info()
                        self.tela = pygame.display.set_mode((info.current_w, info.current_h), pygame.FULLSCREEN)
                        print(f"Display restaurado ({d})")
                        break
                    except Exception: continue
                continue

            if self.exibindo_splash: self._render_splash()
            elif MODO_ROBO_ATUAL == "TERAPEUTA": self._render_modo_terapeuta()
            elif self.modo_jogo: self._render_jogo()
            else: self._render_rosto()
            
            pygame.display.flip(); clock.tick(15)
        pygame.quit(); sys.exit()

    def desenhar_texto_quebrado(self, texto, fonte, cor, rect_area):
        palavras = texto.split(' ')
        linhas = []
        linha_atual = []
        for p in palavras:
            linha_atual.append(p)
            w, h = fonte.size(' '.join(linha_atual))
            if w > rect_area.width:
                linha_atual.pop()
                linhas.append(' '.join(linha_atual))
                linha_atual = [p]
        linhas.append(' '.join(linha_atual))
        
        total_h = len(linhas) * fonte.get_linesize()
        start_y = rect_area.top 
        
        # Ajuste para centralizar o bloco verticalmente se for curto
        if total_h < rect_area.height:
            start_y = rect_area.centery - (total_h // 2)
        
        for i, linha in enumerate(linhas):
            surf = fonte.render(linha, True, cor)
            r = surf.get_rect(centerx=rect_area.centerx, y=start_y + i * fonte.get_linesize())
            self.tela.blit(surf, r)

    def _render_rosto(self):
        self.tela.fill(PRETO)
        
        # Desenha apenas o sprite da boca (o rosto físico já tem olhos de vidro/LED)
        if self.sprite_atual:
            rect = self.sprite_atual.get_rect(center=(self.w // 2, self.pos_boca_y))
            self.tela.blit(self.sprite_atual, rect)
            
        # EXIBIÇÃO DA RESPOSTA DA IA NO MODO CRIANÇA
        global TEXTO_RESPOSTA_IA
        if TEXTO_RESPOSTA_IA:
            self.desenhar_texto_quebrado(TEXTO_RESPOSTA_IA, self.fonte_peq, BRANCO, self.rect_texto_ia)
            
        if self.status_texto:
            txt = self.fonte_peq.render(self.status_texto, True, self.cor_status)
            self.tela.blit(txt, (self.w // 2 - txt.get_width()//2, self.h - 50))

    def _render_jogo(self):
        if self.tipo_jogo == "cores":
            pygame.draw.rect(self.tela, VERMELHO, self.rect_jogo_esq)
            pygame.draw.rect(self.tela, AZUL_FORTE, self.rect_jogo_dir)
            txt_esq = self.fonte_jogo.render("VERMELHO", True, BRANCO)
            txt_dir = self.fonte_jogo.render("AZUL", True, BRANCO)
            self.tela.blit(txt_esq, (self.w//4 - txt_esq.get_width()//2, self.h//2 - txt_esq.get_height()//2))
            self.tela.blit(txt_dir, (3*self.w//4 - txt_dir.get_width()//2, self.h//2 - txt_dir.get_height()//2))
        elif self.tipo_jogo == "adivinhacao":
            self.tela.fill(self.cor_jogo)
            area_texto = pygame.Rect(50, 50, self.w - 100, self.h - 100)
            self.desenhar_texto_quebrado(self.texto_jogo, self.fonte_charada, BRANCO, area_texto)
        elif self.tipo_jogo == "parear":
            self._render_jogo_parear()
        elif self.tipo_jogo == "visao":
            self._render_visao_camera()
        else: self._render_rosto() # Fallback

    def _render_visao_camera(self):
        self.tela.fill(PRETO)
        global FRAME_CAMERA
        if FRAME_CAMERA:
            img = pygame.transform.scale(FRAME_CAMERA, (self.w, self.h))
            self.tela.blit(img, (0, 0))
            txt = self.fonte_peq.render("MODO VISÃO ATIVO", True, VERDE)
            self.tela.blit(txt, (20, 20))
        else:
            self.desenhar_texto_quebrado("Aguardando câmera...", self.fonte_media, BRANCO, self.tela.get_rect())

    def _render_jogo_parear(self):
        self.tela.fill((235, 250, 255))
        # Simplificado para o TiriloV3
        txt = self.fonte_media.render("JOGO PAREAR", True, AZUL)
        self.tela.blit(txt, (self.w//2 - txt.get_width()//2, 20))
        
        # Desenha os círculos/alvos se definidos
        if hasattr(self, 'parear_dados'):
            for q in self.parear_dados['quadrados']:
                pygame.draw.rect(self.tela, q['cor'], q['rect'])
            for c in self.parear_dados['circulos']:
                pygame.draw.circle(self.tela, c['cor'], (int(c['x']), int(c['y'])), 40)
                pygame.draw.circle(self.tela, PRETO, (int(c['x']), int(c['y'])), 40, 2)

    def _render_modo_terapeuta(self):
        self.tela.fill(AZUL_ESPECIAL)
        
        # Título do Modo
        titulo = self.fonte_grande.render("MODO DOUTOR TIRILO", True, AMARELO)
        self.tela.blit(titulo, (self.w // 2 - titulo.get_width()//2, 20))
        
        # EXIBIÇÃO DA RESPOSTA DA IA NO MODO TERAPEUTA
        global TEXTO_RESPOSTA_IA
        if not self.lista_ativa and TEXTO_RESPOSTA_IA:
             # Desenha a resposta da IA na maior área disponível, usando fonte pequena
            area_central = pygame.Rect(self.w * 0.1, self.h * 0.15, self.w * 0.8, self.h * 0.65)
            self.desenhar_texto_quebrado(TEXTO_RESPOSTA_IA, self.fonte_peq, BRANCO, area_central)


        # Status
        status_txt = self.fonte_peq.render(self.status_texto, True, self.cor_status)
        self.tela.blit(status_txt, (self.w // 2 - status_txt.get_width()//2, self.h - 50))
        
        # ----------------------------------------------------
        # RENDERIZAÇÃO DA LISTA DE ARQUIVOS (Se ativa)
        # ----------------------------------------------------
        if self.lista_ativa:
            pygame.draw.rect(self.tela, CINZA, (50, 100, self.w - 100, self.h - 200), border_radius=10)
            
            # Título da Lista
            list_title = self.fonte_media.render("ARQUIVOS DE LOGS", True, BRANCO)
            self.tela.blit(list_title, (self.w // 2 - list_title.get_width()//2, 110))
            
            # Itens da Lista
            font_item = self.fonte_peq
            y_start = 160
            max_items = int((self.h - 220) / font_item.get_linesize())

            for i, filename in enumerate(self.arquivos_listados[self.offset_lista:]):
                if i >= max_items: break
                
                # Renderiza o item
                text_surf = font_item.render(f"{i+self.offset_lista+1}. {filename}", True, AMARELO)
                text_rect = text_surf.get_rect(topleft=(70, y_start + i * font_item.get_linesize()))
                self.tela.blit(text_surf, text_rect)

        
    def _render_splash(self):
        self.tela.fill(PRETO); cx, cy = self.w // 2, self.h // 2
        self.tela.blit(self.fonte_grande.render(f"Robô {NOME_ROBO}", True, AZUL), (cx-140, cy-120))
        txt_ver = self.fonte_media.render(f"Versão {VERSAO_ATUAL}", True, BRANCO)
        self.tela.blit(txt_ver, (cx - txt_ver.get_width()//2, cy - 20))
        self.tela.blit(self.fonte_peq.render(f"Dev: {AUTOR}", True, CINZA), (cx-140, cy+60))
        self.tela.blit(self.fonte_peq.render(self.msg_loading, True, VERDE), (cx-140, cy+140))

        # Exibe o IP
        ip_texto = f"IP: {self.endereco_ip}"
        txt_ip = self.fonte_peq.render(ip_texto, True, AMARELO)
        self.tela.blit(txt_ip, (self.w - txt_ip.get_width() - 10, self.h - txt_ip.get_height() - 10))

    def set_boca(self, estado):
        if self.sprites and estado in self.sprites: self.sprite_atual = self.sprites[estado]
    def set_status(self, texto, cor=CINZA):
        self.status_texto = texto; self.cor_status = cor
    def set_splash(self, ativo): self.exibindo_splash = ativo
    def atualizar_loading(self, texto): self.msg_loading = texto
    def iniciar_jogo(self, tipo): 
        self.modo_jogo = True; self.tipo_jogo = tipo; self.ultimo_toque = None
    def parar_jogo(self): 
        self.modo_jogo = False; self.cor_status = AZUL; self.set_boca("fechada")
        self.lista_ativa = False # Garante que a lista de arquivos suma
    
    def listar_arquivos(self):
        """Preenche self.arquivos_listados com o conteúdo de DIR_LOGS."""
        global TEXTO_RESPOSTA_IA
        TEXTO_RESPOSTA_IA = "" # Limpa a resposta da IA
        try:
            self.arquivos_listados = sorted(os.listdir(DIR_LOGS))
            self.offset_lista = 0
            self.lista_ativa = True
            self.set_status(f"{len(self.arquivos_listados)} logs encontrados.", AMARELO)
        except Exception as e:
            self.set_status(f"Erro ao listar logs: {e}", VERMELHO)

    def iniciar_parear(self):
        self.iniciar_jogo("parear")
        cores = [VERMELHO, AZUL, VERDE, AMARELO]
        nomes_cores = ["vermelha", "azul", "verde", "amarela"]
        quadrados = []
        circulos = []
        tam = 100
        esp = (self.w - 4*tam)//5
        for i, cor in enumerate(cores):
            quadrados.append({'rect': pygame.Rect(esp + i*(tam+esp), 80, tam, tam), 'cor': cor, 'id': i, 'pareado': False})
            circulos.append({
                'x': esp + i*(tam+esp) + tam//2, 'y': self.h - 100,
                'cor': cor, 'id': i,
                'orig_x': esp + i*(tam+esp) + tam//2, 'orig_y': self.h - 100,
                'pareado': False
            })
        self.parear_dados = {'quadrados': quadrados, 'circulos': circulos, 'arrastando': None, 'acertos': 0}
        # Fala as instruções ao iniciar
        threading.Thread(target=falar, args=("Vamos parear as cores! Arraste a bolinha colorida até o quadrado da mesma cor!",)).start()

    def processar_toque_parear(self, x, y, up=False):
        if not hasattr(self, 'parear_dados'): return
        if up:
            if self.parear_dados['arrastando']:
                c = self.parear_dados['arrastando']
                alvo = self.parear_dados['quadrados'][c['id']]
                if not alvo['pareado'] and alvo['rect'].collidepoint(x, y):
                    # Acerto!
                    c['x'], c['y'] = alvo['rect'].center
                    c['pareado'] = True
                    alvo['pareado'] = True
                    self.parear_dados['acertos'] += 1
                    acertos = self.parear_dados['acertos']
                    total = len(self.parear_dados['circulos'])
                    if acertos >= total:
                        # Todos pareados - parabens e sai
                        def _finalizar():
                            falar("Parabéns! Você pareou todas as cores! Muito bem!")
                            time.sleep(3)
                            self.parar_jogo()
                        threading.Thread(target=_finalizar).start()
                    else:
                        falar_prioridade("Isso mesmo!")
                else:
                    # Errou - volta
                    c['x'], c['y'] = c['orig_x'], c['orig_y']
                self.parear_dados['arrastando'] = None
            return

        for c in self.parear_dados['circulos']:
            if not c['pareado'] and math.hypot(c['x']-x, c['y']-y) < 50:
                self.parear_dados['arrastando'] = c
                break
        
        if self.parear_dados['arrastando']:
            self.parear_dados['arrastando']['x'] = x
            self.parear_dados['arrastando']['y'] = y


gui = None

# --- 5. LÓGICA ---
def animar_fala(evento_parada):
    while not evento_parada.is_set():
        if gui and gui.modo_jogo and gui.tipo_jogo == "emocoes": 
            time.sleep(0.1)
            continue
            
        if olhos:
            # Sincronia de boca (Lip Sync simplificado)
            abertura = random.choice([0, 50, 80, 50, 100])
            olhos.mover_boca(abertura)
            if gui:
                if abertura == 0: gui.set_boca('fechada')
                elif abertura <= 50: gui.set_boca('media')
                else: gui.set_boca('aberta')
        
        time.sleep(random.uniform(0.1, 0.2))
    
    if olhos: 
        olhos.mover_boca(0)
    if gui: gui.set_boca('fechada')

def _capturar_com_vad(arquivo_saida):
    """Grava voz com VAD por energia: para automaticamente ao detectar silêncio.
    Requer: pyaudio, audioop (stdlib), wave (stdlib).
    Levanta RuntimeError se nenhuma voz for detectada."""
    import pyaudio
    import audioop
    import wave

    CHUNK          = 1024
    RATE           = 16000
    SILENCE_THRESH = 400   # RMS mínimo para considerar voz ativa
    SILENCE_CHUNKS = 20    # ~1.3s de silêncio após a fala para encerrar
    MAX_CHUNKS     = 375   # ~24s absoluto (segurança)

    pa = pyaudio.PyAudio()

    # Encontra o primeiro dispositivo de entrada disponível
    mic_idx = None
    for i in range(pa.get_device_count()):
        info = pa.get_device_info_by_index(i)
        if info.get("maxInputChannels", 0) > 0:
            mic_idx = i
            break

    stream = pa.open(format=pyaudio.paInt16, channels=1, rate=RATE,
                     input=True, input_device_index=mic_idx,
                     frames_per_buffer=CHUNK)
    frames = []
    silent_count = 0
    speaking = False

    try:
        for _ in range(MAX_CHUNKS):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            rms = audioop.rms(data, 2)
            if rms > SILENCE_THRESH:
                speaking = True
                silent_count = 0
            elif speaking:
                silent_count += 1
                if silent_count >= SILENCE_CHUNKS:
                    break
    finally:
        stream.stop_stream()
        stream.close()
        pa.terminate()

    if not speaking:
        raise RuntimeError("Nenhuma voz detectada")

    with wave.open(arquivo_saida, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)      # paInt16 = 2 bytes
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))


def capturar_voz():
    try:
        if gui: gui.set_status("Ouvindo...", VERDE)
        # Pequeno delay para garantir que o hardware de áudio (aplay) foi liberado
        time.sleep(0.2)

        # Tenta VAD via pyaudio; fallback para arecord 4s fixo se não disponível
        try:
            _capturar_com_vad(ARQUIVO_REC)
        except RuntimeError:
            # Silêncio total — nada a transcrever
            if gui: gui.set_status("Pronto!", CINZA)
            return None
        except Exception as e_vad:
            print(f"VAD indisponível ({e_vad}), usando arecord 4s...")
            subprocess.run(
                ["arecord", "-D", DISPOSITIVO_AUDIO, "-d", "4", "-f", "cd", "-q", ARQUIVO_REC],
                check=True
            )

        if not os.path.exists(ARQUIVO_REC):
            return None

        if gui: gui.set_status("Processando...", AZUL)
        with sr.AudioFile(ARQUIVO_REC) as source:
            audio = r.record(source)
        texto = r.recognize_google(audio, language="pt-BR").lower()
        return texto

    except Exception as e:
        print(f"Erro na captura de voz (pode ser internet): {e}")
        if gui: gui.set_status("Erro Voz", VERMELHO)
        return None

def falar_prioridade(texto, local_fast=False): 
    threading.Thread(target=falar, args=(texto, local_fast)).start()

async def gerar_audio_edge(texto, arquivo):
    """Gera áudio usando Microsoft Edge TTS."""
    voz = "pt-BR-AntonioNeural"
    comunicador = edge_tts.Communicate(texto, voz)
    await comunicador.save(arquivo)

def _monitorar_barge_in(processo_audio):
    """Escuta o microfone via arecord enquanto o robô fala (modo Terapeuta).
    Se detectar voz contínua, termina o processo de áudio imediatamente."""
    import struct
    import math

    CHUNK_BYTES = 1024   # 512 amostras S16_LE
    THRESH      = 600    # RMS mínimo para voz (ajuste se falso-positivo)
    CONFIRMA    = 3      # chunks consecutivos ~= 100ms de voz para confirmar

    proc_rec = None
    try:
        proc_rec = subprocess.Popen(
            ["arecord", "-D", DISPOSITIVO_AUDIO, "-f", "S16_LE",
             "-r", "16000", "-c", "1", "-q"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL
        )
        count = 0
        print("Barge-in: monitorando mic...")
        while processo_audio.poll() is None and not _parar_fala.is_set():
            data = proc_rec.stdout.read(CHUNK_BYTES)
            if len(data) < CHUNK_BYTES:
                break
            samples = struct.unpack(f"<{len(data)//2}h", data)
            rms = math.sqrt(sum(s * s for s in samples) / len(samples))
            if rms > THRESH:
                count += 1
                if count >= CONFIRMA:
                    print(f"Barge-in detectado! RMS={rms:.0f} — interrompendo fala.")
                    _parar_fala.set()
                    try: processo_audio.terminate()
                    except: pass
                    break
            else:
                count = max(0, count - 1)
    except Exception as e:
        print(f"Barge-in monitor erro: {e}")
    finally:
        if proc_rec and proc_rec.poll() is None:
            try: proc_rec.terminate()
            except: pass


def falar(texto, local_fast=False):
    if not texto: return

    # Define cor do status com base no modo
    if MODO_ROBO_ATUAL == "TERAPEUTA":
        cor_fala = AZUL_ESPECIAL
    else:
        cor_fala = gui.cor_status if gui and gui.cor_status != CINZA else AZUL

    if gui: gui.set_status("Falando...", cor_fala)

    evt = threading.Event()
    t_anim = threading.Thread(target=animar_fala, args=(evt,))

    try:
        txt = str(texto).replace('*', '').replace('#', '')

        if MODO_ROBO_ATUAL == "TERAPEUTA":
            # --- Edge-TTS (voz neural Antonio) + barge-in — Modo Terapeuta ---
            import tempfile
            arq_mp3 = tempfile.mktemp(suffix=".mp3")
            try:
                asyncio.run(gerar_audio_edge(txt, arq_mp3))
                t_anim.start()
                proc_audio = subprocess.Popen(
                    ["mpg123", "-a", DISPOSITIVO_AUDIO, "-q", arq_mp3],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                threading.Thread(target=_monitorar_barge_in, args=(proc_audio,), daemon=True).start()
                proc_audio.wait()
            except Exception as e:
                print(f"IA: Falha Edge-TTS ({e}), usando espeak...")
                _falar_espeak(txt, t_anim)
            finally:
                if os.path.exists(arq_mp3):
                    try: os.remove(arq_mp3)
                    except: pass
        else:
            # --- espeak-ng pipeline (voz robótica) — Modo Criança ---
            _falar_espeak(txt, t_anim)

    except Exception as e:
        print(f"Erro TTS: {e}")
        if gui: gui.set_status("Erro Voz", VERMELHO)
    finally:
        evt.set()
        if t_anim.is_alive(): t_anim.join()
        if gui: gui.set_status("Pronto!", CINZA)
        if olhos: olhos.mover_boca(0)


def _falar_espeak(txt, t_anim):
    """Pipeline espeak-ng --stdout | aplay sem arquivo em disco."""
    try:
        p_espeak = subprocess.Popen(
            ["espeak-ng", "-v", ESPEAK_VOZ, "-s", ESPEAK_VELOCIDADE,
             "-p", ESPEAK_PITCH, "--stdout", txt],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL
        )
        if not t_anim.is_alive():
            t_anim.start()
        subprocess.run(
            ["aplay", "-D", DISPOSITIVO_AUDIO, "-q"],
            stdin=p_espeak.stdout,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        p_espeak.stdout.close()
        p_espeak.wait()
    except Exception as e:
        print(f"IA: Falha no Espeak: {e}")

def perguntar_gemini(texto):
    global TEXTO_RESPOSTA_IA, MODO_VISAO_ATIVO
    if not CLIENTE_GEMINI:
        TEXTO_RESPOSTA_IA = "Erro: Sem chave de IA."
        return "Sem chave."

    try:
        # --- 1. ANIMAÇÃO IMEDIATA ---
        _parar_fala.clear()  # Reseta barge-in para esta interação
        antigo_modo_visao = MODO_VISAO_ATIVO
        MODO_VISAO_ATIVO = False
        if olhos:
            threading.Thread(target=olhos.olhar_cima, daemon=True).start()
            olhos.mover_boca(0)

        if MODO_ROBO_ATUAL == "TERAPEUTA":
            log_terapeuta(f"Terapeuta: {texto}")

        # --- 2. PREPARA PROMPT E INICIA STREAM EM PARALELO ---
        instrucao = ler_diretriz_ia(MODO_ROBO_ATUAL)

        # Garante instruções de jogo mesmo se a diretriz vier do Supabase sem elas
        if MODO_ROBO_ATUAL == "CRIANCA":
            # Usa jogos carregados do Supabase; fallback para lista padrão
            if _jogos_disponiveis:
                lista_jogos = "\n".join(
                    f"- {j['codigo']:<14} → {j['nome']}" for j in _jogos_disponiveis
                )
                exemplo_codigo = _jogos_disponiveis[0]["codigo"]
            else:
                lista_jogos = (
                    "- cores          → Jogo das Cores\n"
                    "- emocoes        → Jogo das Emoções\n"
                    "- adivinhacao    → Charadas de Animais\n"
                    "- musica         → Tocar Música\n"
                    "- parear         → Parear Cores"
                )
                exemplo_codigo = "cores"
            instrucao += f"""

REGRA OBRIGATÓRIA DE JOGOS:
Quando a criança mencionar jogar, brincar ou qualquer jogo, você DEVE escolher um jogo e incluir a tag no final da resposta.
NÃO faça perguntas. Escolha diretamente e inclua a tag.
NÃO diga a tag em voz alto — ela é invisível para a criança.

Jogos disponíveis (use o código exato da coluna esquerda):
{lista_jogos}

FORMATO OBRIGATÓRIO quando a criança quer jogar:
Frase animada curta! [JOGO:codigo]

EXEMPLOS:
Criança: "quero jogar" → "Vamos brincar! [JOGO:{exemplo_codigo}]"
Criança: "brincar" → "Que divertido! Vamos jogar! [JOGO:{exemplo_codigo}]"
"""

        # Conteúdo enviado ao modelo: dica explícita se for jogar
        texto_l_hint = texto.lower()
        if MODO_ROBO_ATUAL == "CRIANCA" and any(w in texto_l_hint for w in ["jogar", "brincar", "jogo", "brincadeira"]):
            contents_msg = f"{texto}\n(OBRIGATÓRIO: termine com [JOGO:codigo])"
        else:
            contents_msg = texto

        chunks_fila: queue.Queue = queue.Queue()

        def _streamer():
            try:
                for chunk in CLIENTE_GEMINI.models.generate_content_stream(
                    model=MODELO_IA,
                    contents=[contents_msg],
                    config=types.GenerateContentConfig(system_instruction=instrucao)
                ):
                    if chunk.text:
                        chunks_fila.put(chunk.text)
            except Exception as e_stream:
                print(f"ERRO stream IA: {e_stream}")
            finally:
                chunks_fila.put(None)  # sentinela de fim

        threading.Thread(target=_streamer, daemon=True).start()

        # --- 3. FALA SOM DE PENSAMENTO ENQUANTO IA PROCESSA ---
        som_pensar = random.choice([
            "Ummm, deixa eu ver...",
            "Ummm, deixa eu pensar...",
            "Só um momento...",
            "Ummm, boa pergunta...",
        ])
        falar(som_pensar)  # bloqueia ~2s — stream já está rodando em paralelo

        # Retoma rastreamento e olha para frente ao responder
        MODO_VISAO_ATIVO = antigo_modo_visao
        if olhos:
            threading.Thread(target=olhos.olhar_frente, daemon=True).start()

        # --- 4. FALA CADA FRASE ASSIM QUE CHEGA NO STREAM ---
        buffer = ""
        resposta_completa = ""
        jogo_detectado = None

        while not _parar_fala.is_set():
            try:
                chunk_texto = chunks_fila.get(timeout=15)
            except Exception:
                break
            if chunk_texto is None:
                break
            buffer += chunk_texto
            resposta_completa += chunk_texto

            # Fala frases completas (termina em . ! ?)
            while True:
                match = re.search(r'[^.!?]*[.!?]', buffer)
                if match:
                    sentenca = match.group(0)
                    buffer = buffer[match.end():]
                    # Detecta tag [JOGO:xxx] antes de falar
                    tag = re.search(r'\[JOGO:(\w+)\]', sentenca)
                    if tag:
                        jogo_detectado = tag.group(1)
                    sentenca_limpa = re.sub(r'\[JOGO:\w+\]', '', sentenca).strip()
                    if sentenca_limpa:
                        falar(sentenca_limpa)
                        if _parar_fala.is_set():
                            break
                else:
                    break
            if _parar_fala.is_set():
                break

        # Fala o restante sem pontuação (se não foi interrompido)
        if buffer.strip() and not _parar_fala.is_set():
            tag = re.search(r'\[JOGO:(\w+)\]', buffer)
            if tag:
                jogo_detectado = tag.group(1)
            resto = re.sub(r'\[JOGO:\w+\]', '', buffer).strip()
            if resto:
                falar(resto)

        TEXTO_RESPOSTA_IA = re.sub(r'\[JOGO:\w+\]', '', resposta_completa).strip()

        # Diagnóstico: mostra resposta completa e jogo detectado
        print(f"[IA] Resposta: {resposta_completa[:200]}")
        if jogo_detectado:
            print(f"[IA] Jogo detectado: {jogo_detectado}")
        else:
            print("[IA] Nenhuma tag [JOGO:xxx] na resposta.")

        # Lança o jogo escolhido pela IA (após terminar de falar)
        if jogo_detectado and not _parar_fala.is_set():
            _lancar_jogo(jogo_detectado)

        if MODO_ROBO_ATUAL == "TERAPEUTA":
            log_terapeuta(f"{NOME_ROBO}: {resposta_completa}")

        return resposta_completa

    except Exception as e:
        print(f"ERRO IA: {e}")
        TEXTO_RESPOSTA_IA = f"Erro IA: {str(e)[:40]}..."
        return "Tive um erro."

def log_terapeuta(conteudo):
    """Grava interações ou modificações em um arquivo de log para análise."""
    nome_arquivo = os.path.join(DIR_LOGS, f"log_{time.strftime('%Y%m%d')}.txt")
    timestamp = time.strftime('%H:%M:%S')
    try:
        with open(nome_arquivo, "a") as f:
            f.write(f"[{timestamp}] {conteudo}\n")
    except: pass # Ignora falha de log

def finalizar_modo_geral():
    """Para tudo: jogos, música, fala e visão."""
    global MODO_VISAO_ATIVO, TEXTO_RESPOSTA_IA, MODO_VISAO_TELA, _processo_externo
    MODO_VISAO_TELA = False
    if gui: gui.parar_jogo()
    TEXTO_RESPOSTA_IA = ""
    # Encerra processo externo em execução (jogo, calibrador, rastreador etc.)
    if _processo_externo and _processo_externo.poll() is None:
        try:
            _processo_externo.terminate()
            _processo_externo.wait(timeout=2)
        except Exception: pass
        _processo_externo = None
    # Mata processos de áudio
    subprocess.run(["pkill", "-9", "aplay"], stderr=subprocess.DEVNULL)
    subprocess.run(["pkill", "-9", "mpg123"], stderr=subprocess.DEVNULL)
    if olhos:
        olhos.olhar_frente()
        olhos.mover_boca(0)
    falar("Parei tudo.")

def iniciar_calibragem():
    """Lança o calibrador externo."""
    falar("Iniciando calibrador. Por favor, aguarde.")
    if gui: gui.running = False # Tenta fechar o Pygame atual
    time.sleep(1)
    # Tenta rodar o script de calibragem
    try:
        subprocess.run(["python3", os.path.join(os.path.dirname(__file__), "ferramentas", "calibrador_olhos.py")], check=False)
    except: pass
    # Após sair do calibrador, o ideal seria o sistema reiniciar o script.
    # Se não reiniciar, o usuário pode dar boot novamente.
    os._exit(0)

# --- JOGOS ---

def jogar_cores():
    global TEXTO_RESPOSTA_IA
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    if not gui: return
    falar("Vamos jogar! Toque na cor que eu pedir.")
    gui.iniciar_jogo("cores")
    alvo = random.choice(["vermelho", "azul"])
    falar(f"Toque no {alvo}!")
    inicio = time.time(); acertou = False
    while (time.time() - inicio) < 10: 
        if gui.ultimo_toque:
            x, y = gui.ultimo_toque; gui.ultimo_toque = None 
            tocada = "vermelho" if x < gui.w // 2 else "azul"
            if tocada == alvo: falar("Acertou! Muito bem!"); acertou = True
            else: falar(f"Ah, esse era o {tocada}.")
            break
        time.sleep(0.1)
    if not acertou: falar("O tempo acabou.")
    gui.parar_jogo(); falar("Voltando.")

def jogar_emocoes():
    global TEXTO_RESPOSTA_IA
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    if not gui: return
    falar("Vamos brincar de emoções!")
    gui.iniciar_jogo("emocoes")
    if olhos: olhos.olhar_triste()
    gui.set_boca("triste"); gui.set_status("Como estou?", AZUL_TRISTE);
    falar("Estou feliz ou triste?")
    resp = capturar_voz()
    if gui.ultimo_toque: gui.ultimo_toque = None; gui.parar_jogo(); falar("Parando."); return
    if resp and ("triste" in resp or "tristeza" in resp): falar("Isso mesmo! Estou triste.")
    else: falar("Na verdade, estou triste.")
    time.sleep(1)
    if olhos: olhos.surpresa()
    gui.set_boca("surpresa"); gui.set_status("E agora?", AMARELO);
    falar("E agora? O que eu estou sentindo?")
    resp = capturar_voz()
    if gui.ultimo_toque: gui.ultimo_toque = None; gui.parar_jogo(); falar("Parando."); return
    if resp and ("surpreso" in resp or "assustado" in resp): falar("Acertou!")
    else: falar("Estou surpreso!")
    gui.parar_jogo(); falar("Foi divertido!")

def jogar_adivinhacao():
    global TEXTO_RESPOSTA_IA
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    if not gui: return
    global HISTORICO_ANIMAIS
    
    falar("Vou pensar em 5 desafios de uma vez... Espere um pouco!")
    gui.iniciar_jogo("adivinhacao")
    gui.cor_jogo = ROXO_ESCURO; gui.texto_jogo = "Pensando..."
    
    evt = threading.Event(); t = threading.Thread(target=animar_pensamento, args=(evt,)); t.start()
    
    # --- ETAPA 1: BATCH REQUEST ---
    lista_charadas = []
    try:
        usados = ", ".join(HISTORICO_ANIMAIS) if HISTORICO_ANIMAIS else "nenhum"
        p = f"Crie {QTD_CHARADAS} charadas curtas sobre animais para criança. Não repita: {usados}. Formato obrigatório: DICA|ANIMAL em cada linha. Sem numeração."
        
        r = CLIENTE_GEMINI.models.generate_content(model=MODELO_IA, contents=[p])
        linhas = r.text.strip().split('\n')
        
        for linha in linhas:
            if '|' in linha:
                raw_dica, raw_animal = linha.split('|', 1)
                dica = raw_dica.replace("Quem sou eu?", "").replace("Quem sou eu", "")
                dica = dica.replace("DICA:", "").replace("Dica:", "").replace("Dica", "").strip()
                if dica.startswith(":"): dica = dica[1:].strip()
                
                animal = raw_animal.strip().lower()
                lista_charadas.append((dica, animal))
                HISTORICO_ANIMAIS.append(animal)
    except: pass
    
    if not lista_charadas:
        lista_charadas = [
            ("Tenho tromba grande", "elefante"),
            ("Faço miau e gosto de leite", "gato"),
            ("Sou o rei da selva", "leão"),
            ("Tenho pescoço comprido", "girafa"),
            ("Pulo e guardo o filhote na bolsa", "canguru")
        ]
        
    if len(HISTORICO_ANIMAIS) > 20: HISTORICO_ANIMAIS = HISTORICO_ANIMAIS[-20:]
    evt.set(); t.join()
    
    pontos = 0
    perguntas_finais = ["Quem sou eu?", "Sabe qual bicho é?", "Adivinha!", "Que animal sou eu?"]
    gui.ultimo_toque = None 

    for i, (dica, resp_certa) in enumerate(lista_charadas):
        if gui.ultimo_toque: falar("Tá bom, paramos."); break
        
        gui.texto_jogo = dica
        final = random.choice(perguntas_finais)
        falar(f"Número {i+1}: {dica}. {final}")
        
        tentativa = capturar_voz()
        if gui.ultimo_toque: falar("Ok, parando."); break

        if tentativa and resp_certa in tentativa.lower():
            gui.texto_jogo = "ACERTOU!"
            falar(f"Isso! É o {resp_certa}!")
            pontos += 1
        else:
            gui.texto_jogo = resp_certa.upper()
            falar(f"Ah, era o {resp_certa}.")
        
        time.sleep(1.5)
        gui.texto_jogo = "?"
    
    falar(f"Fim de jogo! Você fez {pontos} pontos.")
    gui.parar_jogo();

def tocar_musica():
    global TEXTO_RESPOSTA_IA
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    if not os.path.exists(ARQUIVO_MUSICA): return
    if gui: gui.set_status("🎵 Cantando... 🎵", AMARELO)
    gui.ultimo_toque = None
    try:
        evt = threading.Event()
        t = threading.Thread(target=animar_fala, args=(evt,))
        t.start()
        # Mantém mpg123 pois música geralmente é MP3
        proc = subprocess.Popen(["mpg123", "-a", DISPOSITIVO_AUDIO, "-q", ARQUIVO_MUSICA], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        while proc.poll() is None: 
            if gui and gui.ultimo_toque:
                gui.ultimo_toque = None; proc.terminate(); falar_prioridade("Parei."); break
            time.sleep(0.1)
        evt.set(); t.join()
        if gui: gui.set_status("Pronto!", CINZA)
    except: pass

def animar_pensamento(evento):
    while not evento.is_set():
        if gui: 
            cor = ROXO if gui.cor_status == ROXO else VERMELHO
            gui.set_status("Pensando...", cor)
        time.sleep(0.5)
    if gui: gui.set_status("Pronto", AZUL)
    
def iniciar_modo_terapeuta():
    """Ativa o modo Doutor Tirilo e muda a interface."""
    global MODO_ROBO_ATUAL, NOME_TERAPEUTA, TEXTO_RESPOSTA_IA
    
    # 1. Troca o modo
    MODO_ROBO_ATUAL = "TERAPEUTA"
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    
    # 2. Ativa a IA (a flag modo_ia_ativo será definida no loop_logica)
    
    # 3. Resposta de boas-vindas
    gui.set_status("Aguardando comando...", AZUL_ESPECIAL)
    falar(f"Em que posso servi-lo, {NOME_TERAPEUTA}?")
    
def finalizar_modo_terapeuta():
    """Retorna ao modo criança e desativa a IA."""
    global MODO_ROBO_ATUAL, modo_ia_ativo, TEXTO_RESPOSTA_IA
    MODO_ROBO_ATUAL = "CRIANCA"
    modo_ia_ativo = False # Desativa IA ao sair do modo Terapeuta
    TEXTO_RESPOSTA_IA = "" # Limpa a tela
    gui.parar_jogo()
    gui.set_status("Pronto!", CINZA)
    falar("Voltando ao modo criança.")

def lancar_parear():
    """Lança parearcor.py como subprocess (KMS/DRM exclusivo, sem pausa de câmera)."""
    global gui, _pausar_piscar, _processo_externo
    script = os.path.join(os.path.dirname(__file__), "jogos", "parear_cores", "parearcor.py")
    uid = os.getuid()
    env = os.environ.copy()
    env['XDG_RUNTIME_DIR'] = f'/run/user/{uid}'
    env.pop('SDL_AUDIODRIVER', None)
    _pausar_piscar = True
    if gui:
        gui.suspenso = True
        gui._ev_display_livre.wait(timeout=3)
        gui._ev_display_livre.clear()
    _processo_externo = subprocess.Popen(["python3", script], env=env)
    _processo_externo.wait()
    _processo_externo = None
    _pausar_piscar = False
    if gui:
        gui._ev_retomar.set()


def _lancar_jogo(codigo):
    """Lança um jogo pelo código (comando_entrada) retornado pela IA via tag [JOGO:codigo]."""
    codigo = codigo.strip().lower()
    # Mapa fixo: comando_entrada → função Python
    mapa = {
        "cores":       jogar_cores,
        "emocoes":     jogar_emocoes,
        "adivinhacao": jogar_adivinhacao,
        "musica":      tocar_musica,
        "parear":      lancar_parear,
    }
    # Verifica se o código está entre os jogos carregados do Supabase
    codigos_validos = {j["codigo"] for j in _jogos_disponiveis} if _jogos_disponiveis else set(mapa.keys())
    if codigo not in codigos_validos:
        print(f"Jogo '{codigo}' não está nos jogos disponíveis: {codigos_validos}")
        return
    if codigo in mapa:
        print(f"IA escolheu jogo: {codigo}")
        threading.Thread(target=mapa[codigo], daemon=True).start()
    else:
        print(f"Jogo '{codigo}' válido no Supabase mas sem implementação local.")


# --- LOOP PRINCIPAL ---
def loop_logica():
    global modo_ia_ativo, MODO_ROBO_ATUAL, TEXTO_RESPOSTA_IA 
    
    # 1. Prepara arquivos e conexão Cloud (ESSENCIAL para carregar .env.local)
    global cloud_mgr
    configurar_arquivos_terapeuta()
    configurar_arquivos_diretriz()
    
    # Inicia conexão Cloud (Supabase) PRIMEIRO para carregar as chaves unificadas
    try:
        cloud_mgr = CloudManager()
        print("CloudManager inicializado com sucesso.")
    except Exception as e:
        print(f"Aviso: CloudManager não pôde ser iniciado: {e}")
        
    # Agora configura o Gemini (que usará as chaves carregadas pelo CloudManager)
    configurar_gemini()
    
    # 2. Inicia Hardware e Visão
    inicializar_hardware()
    visao = None
    if olhos:
        visao = VisaoThread(olhos)
        visao.start()
        # Piscada espontânea natural (daemon)
        def _piscar_espontaneo():
            import random as _r
            global _pausar_piscar
            while True:
                time.sleep(_r.uniform(6.0, 16.0))
                if _pausar_piscar or not olhos: continue
                try:
                    olhos.piscar_natural()
                    # Dupla piscada (15% de chance)
                    if _r.random() < 0.15:
                        time.sleep(_r.uniform(0.1, 0.3))
                        if not _pausar_piscar:
                            olhos.piscar_natural()
                except Exception: pass
        threading.Thread(target=_piscar_espontaneo, daemon=True).start()
        
    modo_ia_ativo = True
    if gui: gui.set_splash(False)
    
    # 3. Configura Fila de Comandos Supabase
    comando_fila = queue.Queue()
    if cloud_mgr:
        cloud_mgr.versao_firmware = VERSAO_ATUAL  # Informa a versão ao CloudManager
        def on_nuvem_comando(cmd):
            comando_fila.put(cmd)
        cloud_mgr.register_callback(on_nuvem_comando)
        cloud_mgr.start_listener()
        print(f"Listener de comandos ativado. Firmware: {VERSAO_ATUAL}")
        # Carrega jogos disponíveis da clínica
        global _jogos_disponiveis
        _jogos_disponiveis = cloud_mgr.get_jogos_clinica()

    falar(f"Olá! Eu sou o {NOME_ROBO}. Minha inteligência artificial está ligada. Como posso ajudar você hoje?")
    
    while gui.running:
        try:
            texto = capturar_voz()
            
            if not texto: 
                # --- PROCESSA COMANDOS DA NUVEM (Se houver) ---
                try:
                    while not comando_fila.empty():
                        cmd = comando_fila.get_nowait()
                        payload = cmd.get('comando', '')
                        print(f"Comando recebido: {payload}")
                        
                        if payload == "PARAR":
                            finalizar_modo_geral()
                        elif payload == "MODO_TERAPEUTA":
                            threading.Thread(target=iniciar_modo_terapeuta).start()
                        elif payload == "MODO_CRIANCA":
                            threading.Thread(target=finalizar_modo_terapeuta).start()
                        elif payload == "RELOAD_DIRETRIZES":
                            global _cache_diretriz
                            _cache_diretriz.clear()
                            print("Diretrizes: cache limpo, próxima interação recarrega do Supabase.")
                            falar("Diretrizes atualizadas.")
                        elif payload == "FALAR":
                            msg = cmd.get('parametros', {}).get('texto', '')
                            if msg: falar(msg)
                        elif payload == "JOGAR_CORES":
                            threading.Thread(target=jogar_cores).start()
                        elif payload == "JOGAR_EMOCOES":
                            threading.Thread(target=jogar_emocoes).start()
                        elif payload == "MODO_PAPAGAIO":
                            modo_ia_ativo = False
                            falar("Modo Papagaio ativado. Eu vou repetir tudo!")
                        elif payload == "MODO_CONVERSA":
                            modo_ia_ativo = True
                            falar("Modo Conversa ativado. Vamos bater um papo?")
                        elif payload == "JOGO_PAREAR":
                            payload = "JOGO_PAREAR"  # redireciona para subprocess
                            nome_script = "parearcor.py"
                            def _executar_parear(nome=nome_script, cmd=payload):
                                global gui, _pausar_piscar, _processo_externo
                                script = os.path.join(os.path.dirname(__file__), nome)
                                uid = os.getuid()
                                env = os.environ.copy()
                                env['XDG_RUNTIME_DIR'] = f'/run/user/{uid}'
                                env.pop('SDL_AUDIODRIVER', None)
                                # Pausa piscada (conflito de servos), mas mantém rastreamento ativo
                                # (parearcor.py não usa câmera, apenas display e servos de reação)
                                _pausar_piscar = True
                                if gui:
                                    gui.suspenso = True
                                    gui._ev_display_livre.wait(timeout=3)
                                    gui._ev_display_livre.clear()
                                _processo_externo = subprocess.Popen(["python3", script], env=env)
                                _processo_externo.wait()
                                _processo_externo = None
                                _pausar_piscar = False
                                if gui:
                                    gui._ev_retomar.set()
                            threading.Thread(target=_executar_parear, daemon=True).start()
                        elif payload == "CALIBRAR":
                            threading.Thread(target=iniciar_calibragem).start()
                        elif payload == "VISAO_TELA":
                            global MODO_VISAO_TELA
                            MODO_VISAO_TELA = not MODO_VISAO_TELA
                            if gui: 
                                if MODO_VISAO_TELA: gui.iniciar_jogo("visao")
                                else: gui.parar_jogo()
                            falar("Modo visão " + ("ativado" if MODO_VISAO_TELA else "desativado"))
                        elif payload in ("CALIBRAR_OLHOS", "RASTREADOR_TELA", "COREOGRAFIA_MACDONALD", "COREOGRAFIA_SEULOBATO"):
                            scripts_map = {
                                "CALIBRAR_OLHOS":       "ferramentas/calibrador_olhos.py",
                                "RASTREADOR_TELA":      "ferramentas/rastreador_tela.py",
                                "COREOGRAFIA_MACDONALD":"jogos/coreografia_macdonald/coreografia_macdonald.py",
                                "COREOGRAFIA_SEULOBATO":"jogos/coreografia_seulobato/coreografia_seulobato.py",
                            }
                            nome_script = scripts_map[payload]

                            def _executar_programa(nome=nome_script, cmd=payload):
                                global gui
                                script = os.path.join(os.path.dirname(__file__), nome)
                                uid = os.getuid()
                                env = os.environ.copy()
                                env['XDG_RUNTIME_DIR'] = f'/run/user/{uid}'
                                env.pop('SDL_AUDIODRIVER', None)  # Deixa SDL escolher ALSA automaticamente
                                # Pausa piscada e rastreamento; aguarda câmera ser liberada
                                global MODO_VISAO_ATIVO, _ev_camera_livre, _pausar_piscar, _processo_externo
                                _pausar_piscar = True
                                visao_estava_ativa = MODO_VISAO_ATIVO
                                if visao_estava_ativa:
                                    _ev_camera_livre.clear()
                                    MODO_VISAO_ATIVO = False
                                    _ev_camera_livre.wait(timeout=3)
                                # KMS/DRM é exclusivo: sinaliza a thread principal para liberar o display
                                if gui:
                                    gui.suspenso = True
                                    gui._ev_display_livre.wait(timeout=3)
                                    gui._ev_display_livre.clear()
                                    print(f"Display liberado para {cmd}")
                                # Executa o programa externo (bloqueia até terminar)
                                _processo_externo = subprocess.Popen(["python3", script], env=env)
                                _processo_externo.wait()
                                _processo_externo = None
                                # Restaura rastreamento, piscada e sinaliza thread principal
                                _pausar_piscar = False
                                MODO_VISAO_ATIVO = visao_estava_ativa
                                if gui:
                                    gui._ev_retomar.set()

                            threading.Thread(target=_executar_programa, daemon=True).start()
                except Exception as e: 
                    print(f"Erro ao processar comando: {e}")

                if gui and MODO_ROBO_ATUAL == "CRIANCA":
                    gui.set_status("Pronto!", CINZA)
                continue
            
            # --- DEBUG: Mostra o que ouviu na tela ---
            TEXTO_RESPOSTA_IA = f"Ouvi: {texto}"
            
            texto_l = texto.lower()
            
            # --- CONTROLE DE MODO ---
            
            # 1. TROCA PARA MODO TERAPEUTA
            if ("doutor tirilo" in texto_l or "doutortor turilo" in texto_l or 
                "doutor turilo" in texto_l or "doutoto turilo" in texto_l or 
                "dr torino" in texto_l or "dr tirilo" in texto_l) and MODO_ROBO_ATUAL == "CRIANCA":
                
                modo_ia_ativo = True # Ativa a IA
                iniciar_modo_terapeuta()
                continue
            
            # 2. ENCERRAMENTO
            if "tchau" in texto_l or "sair" in texto_l:
                falar("Tchau!")
                gui.running = False
                break
            
            # --- LÓGICA DO MODO TERAPEUTA ---
            if MODO_ROBO_ATUAL == "TERAPEUTA":
                # Comando de saída explícita do modo
                if "voltar" in texto_l or "sair do modo" in texto_l:
                    finalizar_modo_terapeuta()
                    continue
                # Comando para listar arquivos
                if "listar arquivos" in texto_l or "logs" in texto_l:
                    gui.listar_arquivos()
                    falar("Listando arquivos de logs.")
                    continue
                
                # Conversa normal de IA no modo terapeuta
                if modo_ia_ativo:
                    perguntar_gemini(texto)  # já fala internamente via streaming
                continue # Pula o resto do loop de criança

            # --- LÓGICA DO MODO CRIANÇA ---
            
            if "gemini" in texto_l:
                TEXTO_RESPOSTA_IA = "" # Limpa a tela ao ativar IA
                modo_ia_ativo = True; falar("Cérebro ativado!"); continue

            if "desativar" in texto_l or "eco" in texto_l:
                TEXTO_RESPOSTA_IA = "Modo Eco: IA desativada." # Feedback na tela
                modo_ia_ativo = False; falar("Modo Eco."); continue

            if modo_ia_ativo:
                perguntar_gemini(texto)  # já fala internamente via streaming
            else:
                falar(f"Você disse: {texto}")
        except: pass
    
    if HARDWARE_ATIVO and olhos: 
        olhos.mover_boca(0)
        olhos.fechar_olhos()
    if gui: gui.running = False

if __name__ == "__main__":
    try:
        gui = RoboInterface()
        t = threading.Thread(target=loop_logica); t.daemon = True; t.start()
        gui.loop_renderizacao()
    except Exception as e: print(f"Erro: {e}")
