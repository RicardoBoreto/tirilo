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


# Sincronia Global
IMAGEM_ATUAL = "fazenda"
CICLO_ATUAL = 1

def tocar_musica(arquivo_mp3):
    print(f"[Audio] Procurando: {arquivo_mp3}")
    if not os.path.exists(arquivo_mp3):
        print(f"[Audio] ERRO: arquivo nao encontrado: {arquivo_mp3}")
        return None
    try:
        print(f"[Audio] Tocando com mpg123: {arquivo_mp3}")
        proc = subprocess.Popen(
            ["mpg123", "-o", "alsa", "-a", "default", "-q", arquivo_mp3],
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
    
    global IMAGEM_ATUAL, CICLO_ATUAL
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
    # Mapeamento do bicho de cada ciclo
    bichos_por_ciclo = {
        1: "galinha",
        2: "vaca",
        3: "porco",
        4: "pato",
        5: "pintinho",
        6: "fazenda"
    }

    try:
        ciclo = 1
        while True:
            # Check audio
            if tem_audio and tem_audio.poll() is not None:
                print("[Coreografia] Áudio terminou. Encerrando movimentos.")
                pygame.event.post(pygame.event.Event(pygame.QUIT))
                break
                
            print(f"\n[ CICLO {ciclo} INICIADO ] - Loop de 9 compassos (~23.5s)")
            
            # [Compasso 1] (1 compasso): Preparação - SEMPRE MOSTRA FAZENDA NO INÍCIO
            IMAGEM_ATUAL = "fazenda"
            if ciclo == 1:
                olhos.olhar_neutro(suave=True)
                olhos.mover_suave_ambos(p_alvo=0, duracao=compasso)
            else:
                olhos.olhar_neutro(suave=True)
                time.sleep(compasso)
            
            # [Compasso 2] (1 compasso): Galope Unico ("Toc Toc") - MOSTRA O CAVALO!
            IMAGEM_ATUAL = "cavalo"
            print(f"Compasso 2 (~2.6s) -> Galope! (Mostrando Cavalo)")
            olhos.alternar_piscar(batidas=4, vel=beat/2.0)
            
            # [Compassos 3 a 6] (4 compassos): Varrida Alternada (Fazenda -> Revelação)
            print(f"Compassos 3-6 -> Varrida...")
            for v_idx in range(4):
                if v_idx == 0:
                    IMAGEM_ATUAL = "fazenda"
                    print("  Aguardando o bicho (Fazenda)...")
                elif v_idx == 2:
                    IMAGEM_ATUAL = bichos_por_ciclo.get(ciclo, "fazenda")
                    print(f"  Revelando: {IMAGEM_ATUAL}!")
                
                olhos.mover_suave_ambos(h_alvo=35, duracao=beat*2)
                olhos.mover_suave_ambos(h_alvo=65, duracao=beat*2)

            # [Compassos 7 a 8] (2 compassos): Vesgo e Normal - REVELAÇÃO SONORA (COM BALÃO)
            IMAGEM_ATUAL = f"{bichos_por_ciclo.get(ciclo, 'fazenda')}_som"
            print(f"Compassos 7-8 -> Vesgo e Normal (Mostrando som: {IMAGEM_ATUAL}).")
            for v_idx in range(2):
                # --- GRAN FINALE (COMPASSO 52) ---
                if ciclo == 6 and v_idx == 1:
                    print(f"Gran Finale -> Piscar Sincronizado e Olhos Abertos!")
                    for _ in range(4):
                        olhos.mover_suave_ambos(p_alvo=100, duracao=beat/2.0)
                        olhos.mover_suave_ambos(p_alvo=40, duracao=beat/2.0)
                    olhos.olhar_neutro(suave=True)
                    # No gran finale, mantemos a imagem do bicho com som até o fim
                    IMAGEM_ATUAL = f"{bichos_por_ciclo.get(ciclo, 'fazenda')}_som"
                    olhos.mover_suave_ambos(p_alvo=0, duracao=beat*2)
                    time.sleep(beat * 4) 
                    pygame.event.post(pygame.event.Event(pygame.QUIT))
                    return

                olhos.olhar_vesgo()
                time.sleep((beat * 2) - 0.3)
                olhos.olhar_neutro(suave=True)
                time.sleep((beat * 2) - 0.4)

            # [Compassos 9 a 9.5] (1.5 compassos): Varrida final - VOLTA PARA A FAZENDA
            IMAGEM_ATUAL = "fazenda"
            print(f"Compassos 9-9.5 -> Varrida final (Voltando para Fazenda).")
            olhos.mover_suave_ambos(h_alvo=20, v_alvo=50, duracao=beat*2)
            olhos.mover_suave_ambos(h_alvo=80, v_alvo=50, duracao=beat*2)
            olhos.mover_suave_ambos(h_alvo=20, v_alvo=50, duracao=beat*2)
            
            ciclo += 1
            CICLO_ATUAL = ciclo
            
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

    # Carrega as imagens temáticas
    # Assets: Fazenda, Cavalo, bichos e versões com som (balão)
    arquivos_img = [
        "fazenda.png", "cavalo.png", 
        "galinha.png", "vaca.png", "porco.png", "pato.png", "pintinho.png",
        "galinha_som.png", "vaca_som.png", "porco_som.png", "pato_som.png", "pintinho_som.png"
    ]
    imagens_dict = {}
    dir_atual = os.path.join(os.path.dirname(os.path.abspath(__file__)), "imagens")
    print(f"[UI] Carregando imagens de: {dir_atual}")

    for arq in arquivos_img:
        caminho = os.path.join(dir_atual, arq)
        if os.path.exists(caminho):
            try:
                img = pygame.image.load(caminho).convert_alpha()
                img = pygame.transform.smoothscale(img, (w, h))
                nome_sem_ext = arq.split('.')[0]
                imagens_dict[nome_sem_ext] = img
            except Exception as e:
                print(f"Erro ao carregar {arq}: {e}")
    
    print(f"[UI] Imagens carregadas: {list(imagens_dict.keys())}")

    # Mapeamento Ciclo/Bicho retirado daqui pois agora a thread controla direto pelo nome

    # Inicia a inteligência da coreografia em BACKGROUND sem travar a UI!
    thread_coreografia = threading.Thread(target=rotina_coreografia_background, daemon=True)
    thread_coreografia.start()

    clock = pygame.time.Clock()
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit(0)
            # Foge clicando
            elif event.type == pygame.MOUSEBUTTONDOWN or event.type == pygame.FINGERDOWN:
                pygame.quit()
                sys.exit(0)

        # Lógica sincronizada com o Compasso da Thread de Coreografia
        img_key = IMAGEM_ATUAL
        img_atual = imagens_dict.get(img_key)

        tela.fill(PRETO)
        
        if img_atual:
            tela.blit(img_atual, (0, 0))
        
        # Feedback visual se imagens não existirem
        font = pygame.font.Font(None, 40)
        if not img_atual:
             txt = font.render(f"Tocando {img_key} (Ciclo {CICLO_ATUAL})...", True, (100,100,100))
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
