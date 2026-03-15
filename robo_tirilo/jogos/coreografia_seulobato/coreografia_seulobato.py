#!/usr/bin/env python3
import os
import sys
import time
import threading

# Adiciona raiz do robo_tirilo ao path para encontrar olhos_tirilo.py
PASTA_JOGO = os.path.dirname(os.path.abspath(__file__))
PASTA_ROBO = os.path.dirname(os.path.dirname(PASTA_JOGO))
sys.path.insert(0, PASTA_ROBO)

import subprocess
import pygame

try:
    from olhos_tirilo import ControladorOlhos
except ImportError:
    print("ERRO: Arquivo olhos_tirilo.py não encontrado no diretório!")
    sys.exit(1)


def tocar_musica(arquivo_mp3):
    print(f"[Audio] Procurando: {arquivo_mp3}")
    if not os.path.exists(arquivo_mp3):
        print(f"[Audio] ERRO: arquivo nao encontrado: {arquivo_mp3}")
        return None
    try:
        print(f"[Audio] Tocando com mpg123: {arquivo_mp3}")
        proc = subprocess.Popen(
            ["mpg123", "-q", arquivo_mp3],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        return proc
    except Exception as e:
        print(f"[Audio] Erro ao iniciar mpg123: {e}")
        return None

def rotina_coreografia_background():
    """Roda em uma TREAD SEPARADA totalmente protegida dos travamentos da tela"""
    print("\n--- INICIANDO COREOGRAFIA COMPACTA: SEU LOBATO (92 BPM) ---\n")
    olhos = ControladorOlhos()
    
    bpm = 92.0
    beat = 60.0 / bpm            
    compasso = beat * 4          
    
    caminho_audio = os.path.join(os.path.dirname(os.path.abspath(__file__)), "musica", "seulobato.mp3")
    tem_audio = tocar_musica(caminho_audio)

    # Marcador do inicio real da musica
    tempo_inicio_musica = time.time()

    import random
    def animar_boca_canto():
        """Move a boca suavemente enquanto a música toca, respeitando compassos mudos."""
        time.sleep(0.1)
        while tem_audio and tem_audio.poll() is None:
            decorrido = time.time() - tempo_inicio_musica
            # Descobre em qual compasso global estamos (tempo total dividido pelo tempo de 1 compasso)
            compasso_atual_global = int(decorrido / compasso) + 1 # +1 pois começa do Compasso 1
            
            # Lógica dos silêncios: 1,2, 11,12, 21,22, 31,32, 41,42...
            # Note que: compasso 1%10 = 1, compasso 2%10 = 2, compasso 11%10 = 1...
            resto_dez = compasso_atual_global % 10

            abertura = 0
            if compasso_atual_global < 53 and resto_dez not in (1, 2):
                abertura = random.uniform(40, 90)

            olhos.mover_suave_boca(alvo=abertura, duracao=beat/2.0)
            olhos.mover_suave_boca(alvo=5 if abertura > 0 else 0, duracao=beat/2.0)
            
        # Garante que a boca fecha quando a musica acaba
        olhos.mover_suave_boca(alvo=0, duracao=0.5)

    if tem_audio:
        threading.Thread(target=animar_boca_canto, daemon=True).start()

    try:
        ciclo = 1
        while True:
            if tem_audio and tem_audio.poll() is not None:
                print("\n🎵 A música acabou! Encerrando o ciclo atual e finalizando a rotina.")
                # Envia um evento pro PyGame da tela principal fechar as imagens
                pygame.event.post(pygame.event.Event(pygame.QUIT))
                break
                
            print(f"\n[ CICLO {ciclo} INICIADO ] - Loop de 9 compassos (~23.5s)")
            
            # [Compasso 1] (1 compasso): Preparação
            if ciclo == 1:
                olhos.fechar_olhos(suave=False) 
            olhos.mover_suave_ambos(p_alvo=20, h_alvo=50, duracao=compasso) 
            
            # [Compasso 2] (1 compasso): Galope Unico
            print(f"Compasso 2 (~2.6s) -> Galope!")
            olhos.alternar_piscar(batidas=4, vel=beat/2.0)
            
            # [Compassos 3 a 6.5] (14 tempos): Varrida
            print(f"Compassos 3-6.5 (~5.2s a ~14.3s) -> Varrida Direita/Esquerda")
            for _ in range(3): 
                olhos.mover_suave_ambos(h_alvo=80, v_alvo=50, duracao=beat*2)
                olhos.mover_suave_ambos(h_alvo=20, v_alvo=50, duracao=beat*2)
            olhos.mover_suave_ambos(h_alvo=80, v_alvo=50, duracao=beat*2)
                
            # [Compassos 6.5 a 8.5] (2 compassos): Vesgo alternando com normal
            print(f"Compassos 6.5-8.5 (~14.3s a ~19.5s) -> Vesgo e Normal.")
            for i in range(2):
                # --- GRAN FINALE (COMPASSO 52) ---
                if ciclo == 6 and i == 1:
                    print(f"Compasso 52 (Gran Finale) -> Piscar Sincronizado e Olhos Abertos!")
                    for _ in range(4):
                        olhos.mover_suave_ambos(p_alvo=100, duracao=beat/2.0)
                        olhos.mover_suave_ambos(p_alvo=20, duracao=beat/2.0)
                    olhos.abrir_olhos() 
                    pygame.event.post(pygame.event.Event(pygame.QUIT))
                    return 
                    
                olhos.olhar_vesgo()
                time.sleep((beat * 2) - 0.3)
                olhos.olhar_neutro(suave=True)
                time.sleep((beat * 2) - 0.4)
                
            # [Compassos 8.5 a 9] 
            print(f"Compasso 8.5-9 (~19.5s a ~23.5s) -> Varrida até Finalizar o Loop.")
            olhos.mover_suave_ambos(h_alvo=20, v_alvo=50, duracao=beat*2)
            olhos.mover_suave_ambos(h_alvo=80, v_alvo=50, duracao=beat*2)
            olhos.mover_suave_ambos(h_alvo=20, v_alvo=50, duracao=beat*2)
            
            ciclo += 1
            
    except Exception as e:
        print(f"Erro na Thread de Coreografia: {e}")
        pygame.event.post(pygame.event.Event(pygame.QUIT))

def iniciar_player_visual():
    """Tela Principal (Main Thread) que roda um SlideShow Assíncrono para o Pi"""
    os.environ['SDL_VIDEO_CENTERED'] = '1'
    os.environ["SDL_MOUSEDRV"] = "evdev"
    os.environ["SDL_MOUSEDEV"] = "/dev/input/event3"
    
    pygame.init()
    try:
        info = pygame.display.Info()
        w, h = info.current_w, info.current_h
        tela = pygame.display.set_mode((w, h), pygame.FULLSCREEN)
    except:
        w, h = 800, 480
        tela = pygame.display.set_mode((w, h))

    pygame.mouse.set_visible(False)
    pygame.display.set_caption("Tirilo Coreografia Player")
    PRETO = (0, 0, 0)

    # Carrega as imagens caso elas existam na pasta (se não, fica tela preta)
    arquivos_img = ["fazenda.png", "cavalo.png", "porco.png"] # Aceita os arquivos recém criados
    imagens_carregadas = []
    dir_atual = os.path.join(os.path.dirname(os.path.abspath(__file__)), "imagens")

    for arq in arquivos_img:
        caminho = os.path.join(dir_atual, arq)
        if os.path.exists(caminho):
            try:
                img = pygame.image.load(caminho).convert_alpha()
                # Redimensiona para caber na tela mantendo proporção 
                img = pygame.transform.smoothscale(img, (w, h))
                imagens_carregadas.append(img)
            except: pass

    # Inicia a inteligência da coreografia em BACKGROUND sem travar a UI!
    thread_coreografia = threading.Thread(target=rotina_coreografia_background, daemon=True)
    thread_coreografia.start()

    clock = pygame.time.Clock()
    running = True
    img_idx = 0
    ultimo_slide = pygame.time.get_ticks()

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            # Foge clicando
            elif event.type == pygame.MOUSEBUTTONDOWN or event.type == pygame.FINGERDOWN:
                running = False 

        # Lógica assíncrona do SlideShow (A cada 4 segundos, muda de imagem aleatoriamente)
        agora = pygame.time.get_ticks()
        if len(imagens_carregadas) > 0 and agora - ultimo_slide > 4000:
            img_idx = (img_idx + 1) % len(imagens_carregadas)
            ultimo_slide = agora

        tela.fill(PRETO)
        
        if len(imagens_carregadas) > 0:
            tela.blit(imagens_carregadas[img_idx], (0, 0))
        
        # Pode desenhar texto de carregamento se imagens não existirem
        font = pygame.font.Font(None, 40)
        if len(imagens_carregadas) == 0:
             txt = font.render("Coreografia em Andamento... (Sem Imagens na pasta)", True, (100,100,100))
             tela.blit(txt, (w/2 - txt.get_width()//2, h/2))

        pygame.display.flip()
        clock.tick(30) # Roda lisinho a 30fps enquanto os servos cantam atrás

    pygame.quit()
    sys.exit(0)

if __name__ == "__main__":
    try:
        iniciar_player_visual()
    except KeyboardInterrupt:
        print("\nPrograma interrompido.")
        sys.exit(0)
