#!/usr/bin/env python3
"""
=============================================================================
PROJETO: ROBÔ TIRILO
ARQUIVO: tirilo.py
VERSÃO:  3.24 (Saudação Restaurada)
DATA:    25/11/2025
AUTOR:   Ricardo Alonso Boreto

MUDANÇAS TÉCNICAS:
- Implementação dos ambientes: Robô Tirilo (Criança) e Doutor Tirilo (Terapeuta).
- Diretrizes da IA (persona e regras) externalizadas em arquivos para fácil edição (ia_crianca.txt, ia_terapeuta.txt).
- CORREÇÃO: Restaurada a mensagem de saudação e apresentação do robô, removendo apenas a instrução para ativar a IA.
=============================================================================
"""

import os
import sys
import threading
import time
import subprocess
import random 
import pygame
import speech_recognition as sr
import socket 
# edge_tts removido
from google import genai
from google.genai import types
from gpiozero import Servo, LED

# --- 1. CONFIGURAÇÕES GLOBAIS ---
NOME_ROBO = "Tirilo"
VERSAO_ATUAL = "3.24 (Saudação Restaurada)"
AUTOR = "Ricardo Alonso Boreto"

# Configurações de Jogo
QTD_CHARADAS = 5 

DISPOSITIVO_AUDIO = "plughw:0,0"
ARQUIVO_REC = "/tmp/voz_usuario.wav"
ARQUIVO_TTS = "/tmp/resposta_robo.wav" # Alterado para WAV
DIR_BASE = "/home/boreto/projeto_robo"
DIR_ASSETS = os.path.join(DIR_BASE, "assets")
DIR_LOGS = os.path.join(DIR_BASE, "logs") # Diretório para logs e dados
ARQUIVO_MUSICA = os.path.join(DIR_ASSETS, "musica.mp3")

# ARQUIVOS DE PERFIL E MODO
ARQUIVO_TERAPEUTA = os.path.join(DIR_BASE, "terapeuta.txt")
ARQUIVO_IA_CRIANCA = os.path.join(DIR_BASE, "ia_crianca.txt")
ARQUIVO_IA_TERAPEUTA = os.path.join(DIR_BASE, "ia_terapeuta.txt")

NOME_TERAPEUTA = "Terapeuta" # Valor padrão, será lido ou substituído
MODO_ROBO_ATUAL = "CRIANCA" # Pode ser "CRIANCA" ou "TERAPEUTA"
TEXTO_RESPOSTA_IA = "" # Variável global para exibição na tela

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
MODELO_IA = "gemini-2.0-flash"


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

Comandos de Jogo:
Se a criança disser 'jogar', diga 'Vamos jogar o jogo das cores!'.
Se a criança disser 'emoções', diga 'Vamos brincar de sentimentos!'.
Se a criança disser 'charada', diga 'Vamos brincar de adivinhação!'.
"""
    if not os.path.exists(ARQUIVO_IA_CRIANCA):
        try:
            with open(ARQUIVO_IA_CRIANCA, "w") as f:
                f.write(diretriz_crianca.strip())
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
    """Lê e retorna o conteúdo da diretriz para o modo especificado."""
    if modo == "TERAPEUTA":
        caminho = ARQUIVO_IA_TERAPEUTA
    else:
        caminho = ARQUIVO_IA_CRIANCA
        
    try:
        with open(caminho, "r") as f:
            diretriz = f.read()
            # Substitui placeholders antes de retornar, garantindo o nome do terapeuta atual
            diretriz = diretriz.replace("{NOME_ROBO}", NOME_ROBO).replace("{NOME_TERAPEUTA}", NOME_TERAPEUTA)
            return diretriz.strip()
    except Exception as e:
        print(f"ERRO: Não foi possível ler o arquivo de diretriz para {modo}: {e}")
        # Fallback para evitar falha da IA
        return "Você é um robô. Responda educadamente."


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


# --- 2. HARDWARE ---
PINO_BOCA = 18; PINO_OLHO_D = 23; PINO_OLHO_E = 24
try:
    sys.stderr = open(os.devnull, 'w')
    servo_boca = Servo(PINO_BOCA)
    led_dir = LED(PINO_OLHO_D); led_esq = LED(PINO_OLHO_E)
    HARDWARE_ATIVO = True
    sys.stderr = sys.__stderr__
except:
    sys.stderr = sys.__stderr__
    HARDWARE_ATIVO = False

# --- 3. IA ---
CLIENTE_GEMINI = None
def configurar_gemini():
    global CLIENTE_GEMINI
    chave = None
    caminho_chave = os.path.join(DIR_BASE, "chave_gemini.txt") # Usando DIR_BASE
    if os.path.exists(caminho_chave):
        try:
            with open(caminho_chave, "r") as f:
                chave = f.read().strip().replace('"', '').replace("'", "")
        except: pass
    if not chave: chave = os.getenv("GEMINI_API_KEY")
    if chave:
        try: CLIENTE_GEMINI = genai.Client(api_key=chave)
        except: pass

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
                    threading.Thread(target=self.processar_toque, args=(x,y)).start()
                if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE: self.running = False

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
        cor_olhos = self.cor_status if self.cor_status != CINZA else AZUL
        
        pygame.draw.circle(self.tela, cor_olhos, self.centro_olho_esq, self.raio_olho)
        pygame.draw.circle(self.tela, cor_olhos, self.centro_olho_dir, self.raio_olho)
        
        if self.sprite_atual:
            rect = self.sprite_atual.get_rect(center=(self.w // 2, self.pos_boca_y))
            self.tela.blit(self.sprite_atual, rect)
        else:
            larg = int(self.w * 0.3)
            alt = int(self.h * 0.02)
            pygame.draw.rect(self.tela, BRANCO, (self.w//2 - larg//2, self.pos_boca_y, larg, alt))
            
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
        else: self._render_rosto() # Fallback

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


gui = None

# --- 5. LÓGICA ---
def animar_fala(evento_parada):
    opcoes = ['media', 'aberta', 'media']
    while not evento_parada.is_set():
        if gui and gui.modo_jogo and gui.tipo_jogo == "emocoes": time.sleep(0.1); continue
        boca = random.choice(opcoes)
        if gui: gui.set_boca(boca)
        if HARDWARE_ATIVO:
            if boca == 'aberta': servo_boca.max()
            else: servo_boca.mid()
        time.sleep(random.uniform(0.1, 0.2))
    if gui: gui.set_boca('fechada')
    if HARDWARE_ATIVO: servo_boca.min()

def capturar_voz():
    if gui: gui.set_status("Ouvindo...", VERDE)
    if HARDWARE_ATIVO: led_dir.on(); led_esq.on()
    try:
        subprocess.run(["arecord", "-D", DISPOSITIVO_AUDIO, "-d", "4", "-f", "cd", "-q", ARQUIVO_REC], check=True)
        if os.path.exists(ARQUIVO_REC):
            if gui: gui.set_status("Processando...", AZUL)
            with sr.AudioFile(ARQUIVO_REC) as source: audio = r.record(source)
            return r.recognize_google(audio, language="pt-BR").lower()
    except: return None
    return None

def falar_prioridade(texto): threading.Thread(target=falar, args=(texto,)).start()

def falar(texto):
    if not texto: return
    
    # Define a cor do status/olho com base no modo
    if MODO_ROBO_ATUAL == "TERAPEUTA":
        cor_fala = AZUL_ESPECIAL
    else:
        cor_fala = gui.cor_status if gui and gui.cor_status != CINZA else AZUL

    if gui: gui.set_status("Falando...", cor_fala)
    
    try:
        txt = str(texto).replace('*', '').replace('#', '')
        
        # --- GERAÇÃO DE ÁUDIO COM ESPEAK-NG (OFFLINE) ---
        subprocess.run([
            "espeak-ng",
            "-v", ESPEAK_VOZ,
            "-s", ESPEAK_VELOCIDADE,
            "-p", ESPEAK_PITCH,
            "-w", ARQUIVO_TTS,
            txt
        ], check=True)

        evt = threading.Event()
        t = threading.Thread(target=animar_fala, args=(evt,))
        t.start()
        
        # Usa 'aplay' pois o arquivo gerado pelo espeak é WAV
        subprocess.run(["aplay", "-D", DISPOSITIVO_AUDIO, "-q", ARQUIVO_TTS], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        evt.set(); t.join()
        
        if os.path.exists(ARQUIVO_TTS): os.remove(ARQUIVO_TTS)
        if gui: gui.set_status("Pronto!", CINZA)
    except Exception as e:
        print(f"Erro TTS: {e}")
        if gui: gui.set_status("Erro Voz", VERMELHO)

def perguntar_gemini(texto):
    global TEXTO_RESPOSTA_IA
    if not CLIENTE_GEMINI: 
        TEXTO_RESPOSTA_IA = "Erro: Sem chave de IA."
        return "Sem chave."
    try:
        # Carrega a instrução de sistema do arquivo
        instrucao = ler_diretriz_ia(MODO_ROBO_ATUAL)
        
        prompt = f"{instrucao}\n\nFala: {texto}\n{NOME_ROBO}:"
        
        # Gravar a interação (Simples gravação em arquivo para o Modo Terapeuta)
        if MODO_ROBO_ATUAL == "TERAPEUTA":
            log_terapeuta(f"Terapeuta: {texto}")

        resp = CLIENTE_GEMINI.models.generate_content(model=MODELO_IA, contents=[prompt])
        
        resposta = resp.text if resp.text else "Não entendi."
        
        # EXIBIÇÃO: Atualiza a variável global antes de falar
        TEXTO_RESPOSTA_IA = resposta
        
        if MODO_ROBO_ATUAL == "TERAPEUTA":
            log_terapeuta(f"{NOME_ROBO}: {resposta}")
        
        return resposta
    except: 
        TEXTO_RESPOSTA_IA = "Tive um erro de comunicação com a IA."
        return "Tive um erro."

def log_terapeuta(conteudo):
    """Grava interações ou modificações em um arquivo de log para análise."""
    nome_arquivo = os.path.join(DIR_LOGS, f"log_{time.strftime('%Y%m%d')}.txt")
    timestamp = time.strftime('%H:%M:%S')
    try:
        with open(nome_arquivo, "a") as f:
            f.write(f"[{timestamp}] {conteudo}\n")
    except: pass # Ignora falha de log

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
    gui.set_boca("triste"); gui.set_status("Como estou?", AZUL_TRISTE); # gui.cor_olhos = AZUL_TRISTE
    falar("Estou feliz ou triste?")
    resp = capturar_voz()
    if gui.ultimo_toque: gui.ultimo_toque = None; gui.parar_jogo(); falar("Parando."); return
    if resp and ("triste" in resp or "tristeza" in resp): falar("Isso mesmo! Estou triste.")
    else: falar("Na verdade, estou triste.")
    time.sleep(1)
    gui.set_boca("surpresa"); gui.set_status("E agora?", AMARELO); # gui.cor_olhos = AMARELO
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
    estado = True
    while not evento.is_set():
        if gui: 
            cor = ROXO if gui.cor_status == ROXO else VERMELHO
            gui.set_status("Pensando...", cor)
        if HARDWARE_ATIVO:
            if estado: led_dir.on(); led_esq.off()
            else: led_dir.off(); led_esq.on()
        estado = not estado
        time.sleep(0.2)
    if gui: gui.set_status("Pronto", AZUL)
    if HARDWARE_ATIVO: led_dir.on(); led_esq.on()
    
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

# --- LOOP PRINCIPAL ---
def loop_logica():
    global modo_ia_ativo, MODO_ROBO_ATUAL, TEXTO_RESPOSTA_IA 
    
    # Prepara arquivos e IA
    configurar_arquivos_terapeuta()
    configurar_arquivos_diretriz() # Chama a função de configuração
    time.sleep(1)
    if gui: gui.atualizar_loading("Carregando IA..."); time.sleep(1)
    configurar_gemini()
    if gui: gui.atualizar_loading("Carregando Hardware..."); time.sleep(1)
    if HARDWARE_ATIVO: servo_boca.min(); led_dir.on(); led_esq.on()
    
    modo_ia_ativo = False
    if gui: gui.set_splash(False)
    
    # CORREÇÃO: Saudação completa restaurada
    falar(f"Olá! Eu sou o {NOME_ROBO}. Diga 'Gemini' para ativar minha inteligência.")
    
    while gui.running:
        try:
            
            texto = capturar_voz()
            
            if not texto: 
                if gui and MODO_ROBO_ATUAL == "CRIANCA":
                    # Mantém o status "Pronto!" se não ouvir nada no modo criança
                    gui.set_status("Pronto!", CINZA)
                continue
            
            texto_l = texto.lower() # Converte para minúsculas
            
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
                    evt = threading.Event()
                    t = threading.Thread(target=animar_pensamento, args=(evt,))
                    t.start()
                    resp = perguntar_gemini(texto)
                    evt.set(); t.join()
                    falar(resp)
                continue # Pula o resto do loop de criança

            # --- LÓGICA DO MODO CRIANÇA ---
            
            # Limpa a tela ao detectar um comando que não é da IA (ex: jogos)
            if TEXTO_RESPOSTA_IA and ("jogar" in texto_l or "emoções" in texto_l or "charada" in texto_l or "cantar" in texto_l):
                TEXTO_RESPOSTA_IA = "" 


            if "gemini" in texto_l: 
                TEXTO_RESPOSTA_IA = "" # Limpa a tela ao ativar IA
                modo_ia_ativo = True; falar("Cérebro ativado!"); continue
            
            if "desativar" in texto_l or "eco" in texto_l: 
                TEXTO_RESPOSTA_IA = "Modo Eco: IA desativada." # Feedback na tela
                modo_ia_ativo = False; falar("Modo Eco."); continue

            if "jogar" in texto_l or "cores" in texto_l: jogar_cores(); continue
            elif "emoções" in texto_l or "sentimentos" in texto_l: jogar_emocoes(); continue
            elif "charada" in texto_l or "adivinha" in texto_l: jogar_adivinhacao(); continue
            elif "cantar" in texto_l: tocar_musica(); continue
            
            if modo_ia_ativo:
                evt = threading.Event()
                t = threading.Thread(target=animar_pensamento, args=(evt,))
                t.start()
                resp = perguntar_gemini(texto)
                evt.set(); t.join()
                falar(resp)
            else:
                falar(f"Você disse: {texto}")
        except: pass
    
    if HARDWARE_ATIVO: servo_boca.detach(); led_dir.off(); led_esq.off()
    if gui: gui.running = False

if __name__ == "__main__":
    try:
        gui = RoboInterface()
        t = threading.Thread(target=loop_logica); t.daemon = True; t.start()
        gui.loop_renderizacao()
    except Exception as e: print(f"Erro: {e}")
