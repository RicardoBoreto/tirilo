#!/usr/bin/env python3
import os
import sys
import time
import threading
import subprocess
import numpy as np
import wave
import sherpa_onnx
import pygame

def iniciar_tela():
    # Desativa o driver de áudio do Pygame para não travar o dispositivo ALSA (plughw:)
    # permitindo que arecord e aplay usem o hardware diretamente.
    os.environ["SDL_AUDIODRIVER"] = "dummy"

    # --- CONFIGURAÇÃO DE DRIVERS DO RASPBERRY PI ---
    if "DISPLAY" not in os.environ:
        for driver in ['kmsdrm', 'drm', 'fbcon', 'directfb']:
            for index in ['0', '1']:
                try:
                    os.environ["SDL_VIDEODRIVER"] = driver
                    os.environ["SDL_KMSDRM_DEVICE_INDEX"] = index
                    pygame.display.init()
                    break
                except pygame.error:
                    continue
            if pygame.display.get_init(): break

    os.environ['SDL_VIDEO_CENTERED'] = '1'
    pygame.init()

# --- CONFIGURAÇÕES VISUAIS ---
BRANCO = (255, 255, 255)
PRETO = (20, 20, 20)
AZUL_TIRILO = (64, 156, 255)
VERDE_SUCESS = (46, 204, 113)
CINZA = (200, 200, 200)
VERMELHO = (231, 76, 60)
AMARELO = (255, 200, 0)

PASTA_BASE = "/home/boreto/projeto_robo/robo_tirilo/biometria"
MODELO = os.path.join(PASTA_BASE, "wespeaker_en_voxceleb_resnet34.onnx")
DISPOSITIVO_AUDIO = "plughw:CARD=M1A,DEV=0"  # Mesmo dispositivo do tirilo.py

# Garante que o diretório existe
os.makedirs(PASTA_BASE, exist_ok=True)

class BiometriaApp:
    def __init__(self):
        iniciar_tela()
        
        try:
            info = pygame.display.Info()
            self.w, self.h = info.current_w, info.current_h
            self.screen = pygame.display.set_mode((self.w, self.h), pygame.FULLSCREEN)
        except:
            self.w, self.h = 800, 480
            self.screen = pygame.display.set_mode((self.w, self.h))
            
        pygame.display.set_caption("Cadastro de Biometria - Tirilo")
        self.font_titulo = pygame.font.SysFont("Arial", 40, bold=True)
        self.font_btn = pygame.font.SysFont("Arial", 30)
        self.font_msg = pygame.font.SysFont("Arial", 24)
        
        self.running = True
        self.estado = "MENU" # MENU, GRAVANDO, REVISANDO, PROCESSANDO, CONCLUIDO
        self.perfil_selecionado = None # "admin" ou "terapeuta"
        self.progresso = 0
        self.mensagem = "Escolha um perfil para cadastrar"
        
        self.extractor = self.carregar_modelo()
        
    def carregar_modelo(self):
        if not os.path.exists(MODELO):
            print(f"Erro: Modelo não encontrado em {MODELO}")
            return None
        config = sherpa_onnx.SpeakerEmbeddingExtractorConfig(
            model=MODELO, num_threads=2, debug=False
        )
        return sherpa_onnx.SpeakerEmbeddingExtractor(config)

    def desenhar_botao(self, x, y, w, h, texto, cor):
        mouse = pygame.mouse.get_pos()
        click = pygame.mouse.get_pressed()
        
        base_cor = cor
        if x < mouse[0] < x+w and y < mouse[1] < y+h:
            base_cor = (min(255, cor[0]+20), min(255, cor[1]+20), min(255, cor[2]+20))
            if click[0] == 1:
                return True

        pygame.draw.rect(self.screen, base_cor, (x, y, w, h), border_radius=15)
        txt = self.font_btn.render(texto, True, BRANCO)
        self.screen.blit(txt, (x + w//2 - txt.get_width()//2, y + h//2 - txt.get_height()//2))
        return False

    def iniciar_gravacao(self, perfil):
        self.estado = "GRAVANDO"
        self.perfil_selecionado = perfil
        self.progresso = 0
        duracao = 12
        arquivo_wav = os.path.join(PASTA_BASE, f"temp_{perfil}.wav")
        
        def task():
            try:
                # Libera o dispositivo de áudio antes de gravar
                subprocess.run(["pkill", "-9", "arecord"], stderr=subprocess.DEVNULL)
                subprocess.run(["pkill", "-9", "aplay"],  stderr=subprocess.DEVNULL)
                subprocess.run(["pkill", "-9", "mpg123"], stderr=subprocess.DEVNULL)
                time.sleep(0.5)

                print(f"🎤 [GRAVANDO] {perfil.upper()} em {DISPOSITIVO_AUDIO}...")
                cmd = ["arecord", "-D", DISPOSITIVO_AUDIO, "-f", "S16_LE", "-r", "16000", "-d", str(duracao), "-c", "1", arquivo_wav]
                proc = subprocess.Popen(cmd, stderr=subprocess.PIPE)

                for i in range(duracao * 10):
                    if not self.running: break
                    time.sleep(0.1)
                    self.progresso = (i + 1) / (duracao * 10)

                proc.wait()

                if not self.running:
                    return

                # Verifica se o arquivo foi realmente criado e tem conteúdo
                if os.path.exists(arquivo_wav) and os.path.getsize(arquivo_wav) > 0:
                    self.estado = "REVISANDO"
                    self.mensagem = "Gravação concluída. O que deseja fazer?"
                    print(f"✅ [GRAVAÇÃO] Arquivo salvo: {arquivo_wav} ({os.path.getsize(arquivo_wav)} bytes)")
                else:
                    stderr_out = proc.stderr.read().decode(errors='ignore') if proc.stderr else ''
                    self.estado = "MENU"
                    self.mensagem = "Erro: arquivo não gerado. Verifique o microfone."
                    print(f"🚨 ERRO GRAVAÇÃO: arquivo não encontrado ou vazio. arecord stderr: {stderr_out}")
            except Exception as e:
                self.estado = "MENU"
                self.mensagem = f"Erro na gravação: {e}"
                print(f"🚨 ERRO GRAVAÇÃO: {e}")

        threading.Thread(target=task).start()

    def reproduzir_audio(self):
        perfil = self.perfil_selecionado
        arquivo_wav = os.path.join(PASTA_BASE, f"temp_{perfil}.wav")

        def task_play():
            if not os.path.exists(arquivo_wav):
                print(f"🚨 ERRO PLAYBACK: arquivo não encontrado: {arquivo_wav}")
                self.mensagem = "Erro: arquivo de gravação não encontrado."
                return
            try:
                print(f"🔊 [PLAYBACK] Ouvindo {arquivo_wav}...")
                subprocess.run(["pkill", "-9", "arecord"], stderr=subprocess.DEVNULL)
                subprocess.run(["pkill", "-9", "aplay"],  stderr=subprocess.DEVNULL)
                subprocess.run(["pkill", "-9", "mpg123"], stderr=subprocess.DEVNULL)
                time.sleep(0.4)

                res = subprocess.run(["aplay", "-D", DISPOSITIVO_AUDIO, "-q", arquivo_wav], capture_output=True, text=True)
                if res.returncode != 0:
                    print(f"🚨 ERRO ALSA: {res.stderr.strip()}")
                    self.mensagem = f"Erro no áudio: {res.stderr.strip()[:60]}"
                else:
                    print(f"⏹️ [PLAYBACK] Fim do áudio.")
            except Exception as e:
                print(f"🚨 ERRO PLAYBACK: {e}")
        
        threading.Thread(target=task_play).start()

    def finalizar_processamento(self):
        perfil = self.perfil_selecionado
        arquivo_wav = os.path.join(PASTA_BASE, f"temp_{perfil}.wav")
        arquivo_bin = os.path.join(PASTA_BASE, f"perfil_{perfil}.bin")
        
        self.estado = "PROCESSANDO"
        self.mensagem = "Analisando digital da voz..."
        
        def task_proc():
            try:
                print(f"🧠 [IA] Processando {perfil.upper()}...")
                with wave.open(arquivo_wav, 'rb') as f:
                    samples = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
                
                stream = self.extractor.create_stream()
                stream.accept_waveform(16000, samples)
                embedding = self.extractor.compute(stream)
                
                # Conversão e salvamento
                embedding_np = np.array(embedding, dtype=np.float32)
                embedding_np.tofile(arquivo_bin)
                
                print(f"✅ [IA] Sucesso! Perfil salvo: {arquivo_bin}")
                self.estado = "CONCLUIDO"
                self.mensagem = f"Perfil {perfil.upper()} salvo com sucesso!"
                time.sleep(3)
                self.estado = "MENU"
                self.mensagem = "Escolha um perfil para cadastrar"
            except Exception as e:
                self.estado = "MENU"
                self.mensagem = f"Erro IA: {e}"
                print(f"🚨 ERRO IA: {e}")

        threading.Thread(target=task_proc).start()

    def run(self):
        clock = pygame.time.Clock()
        print("--- Iniciando Loop Principal ---")
        try:
            while self.running:
                self.screen.fill(PRETO)
                
                # Título
                titulo = self.font_titulo.render("Biometria Vocal Tirilo", True, AZUL_TIRILO)
                self.screen.blit(titulo, (self.w//2 - titulo.get_width()//2, 40))
                
                # Mensagem Central
                msg = self.font_msg.render(self.mensagem, True, BRANCO)
                self.screen.blit(msg, (self.w//2 - msg.get_width()//2, 110))
                
                if self.estado == "MENU":
                    bw, bh = 250, 120
                    if self.desenhar_botao(self.w//2 - bw - 40, 180, bw, bh, "ADMIN", AZUL_TIRILO):
                        self.iniciar_gravacao("admin")
                        time.sleep(0.5) 
                    if self.desenhar_botao(self.w//2 + 40, 180, bw, bh, "TERAPEUTA", VERDE_SUCESS):
                        self.iniciar_gravacao("terapeuta")
                        time.sleep(0.5)
                    
                    if self.desenhar_botao(self.w//2 - 100, 340, 200, 80, "SAIR", VERMELHO):
                        self.running = False
                        
                elif self.estado == "GRAVANDO":
                    pygame.draw.rect(self.screen, CINZA, (self.w//2 - 250, 250, 500, 40), border_radius=20)
                    pygame.draw.rect(self.screen, AZUL_TIRILO, (self.w//2 - 250, 250, 500 * self.progresso, 40), border_radius=20)
                    instrucao = self.font_msg.render("Fale agora de forma natural...", True, BRANCO)
                    self.screen.blit(instrucao, (self.w//2 - instrucao.get_width()//2, 320))
                
                elif self.estado == "REVISANDO":
                    bw, bh = 240, 100
                    # Botão Ouvir
                    if self.desenhar_botao(self.w//2 - 370, 200, bw, bh, "OUVIR", AMARELO):
                        self.reproduzir_audio()
                        time.sleep(0.3)
                    # Botão Repetir (Renomeado para GRAVAR)
                    if self.desenhar_botao(self.w//2 - 120, 200, bw, bh, "GRAVAR", VERMELHO):
                        self.iniciar_gravacao(self.perfil_selecionado)
                        time.sleep(0.3)
                    # Botão Gerar
                    if self.desenhar_botao(self.w//2 + 130, 200, bw, bh, "GERAR PERFIL", VERDE_SUCESS):
                        self.finalizar_processamento()
                        time.sleep(0.3)
                    
                    if self.desenhar_botao(self.w//2 - 100, 340, 200, 70, "MENU", CINZA):
                        self.estado = "MENU"
                        self.mensagem = "Escolha um perfil para cadastrar"

                elif self.estado == "PROCESSANDO":
                    pygame.draw.circle(self.screen, AZUL_TIRILO, (self.w//2, 270), 40, 5)
                    pygame.display.flip() # Força render
                    
                elif self.estado == "CONCLUIDO":
                    sucesso = self.font_titulo.render("✔ SUCESSO", True, VERDE_SUCESS)
                    self.screen.blit(sucesso, (self.w//2 - sucesso.get_width()//2, 250))

                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        self.running = False
                    
                    if event.type == pygame.FINGERDOWN:
                        touch_x, touch_y = int(event.x * self.w), int(event.y * self.h)
                        print(f"📍 TOQUE DETECTADO: x={touch_x}, y={touch_y} (Estado: {self.estado})")
                        # Move mouse para coordenadas de toque
                        pygame.mouse.set_pos((touch_x, touch_y))
                        
                        if self.estado == "MENU":
                            bw, bh = 250, 120
                            if (self.w//2 - bw - 40) < touch_x < (self.w//2 - 40) and 180 < touch_y < 300:
                                self.iniciar_gravacao("admin")
                            elif (self.w//2 + 40) < touch_x < (self.w//2 + 40 + bw) and 180 < touch_y < 300:
                                self.iniciar_gravacao("terapeuta")
                            elif (self.w//2 - 100) < touch_x < (self.w//2 + 100) and 340 < touch_y < 420:
                                self.running = False
                        
                        elif self.estado == "REVISANDO":
                            bw, bh = 240, 100
                            # Ouvir (Amarelo)
                            if (self.w//2 - 370) < touch_x < (self.w//2 - 370 + bw) and 200 < touch_y < 300:
                                print("🔔 Botão OUVIR pressionado.")
                                self.reproduzir_audio()
                            # Gravar (Vermelho)
                            elif (self.w//2 - 120) < touch_x < (self.w//2 - 120 + bw) and 200 < touch_y < 300:
                                print("🔔 Botão GRAVAR pressionado.")
                                self.iniciar_gravacao(self.perfil_selecionado)
                            # Gerar (Verde)
                            elif (self.w//2 + 130) < touch_x < (self.w//2 + 130 + bw) and 200 < touch_y < 300:
                                print("🔔 Botão GERAR PERFIL pressionado.")
                                self.finalizar_processamento()
                            # Menu
                            elif (self.w//2 - 100) < touch_x < (self.w//2 + 100) and 340 < touch_y < 410:
                                self.estado = "MENU"
                
                pygame.display.flip()
                clock.tick(30)
        except Exception as e:
            print(f"🚨 CRASH no Loop Principal: {e}")
        finally:
            pygame.quit()
            print("--- Aplicação Encerrada ---")

if __name__ == "__main__":
    app = BiometriaApp()
    app.run()
