#!/usr/bin/env python3
"""
ARQUIVO: ferramentas/testar_vozes_tts.py
DESCRIÇÃO: Utilitário CLI para testar vozes Piper usando a mesma lógica do tirilo.py.
AUTOR: Antigravity/Ricardo Alonso Boreto
DATA: 06/04/2026
"""

import os
import sys
import subprocess
import time
import requests
import wave
import socket
import threading
from pathlib import Path

# Tenta carregar o Piper (igual ao tirilo.py)
try:
    from piper.voice import PiperVoice
except ImportError:
    print("\n[ERRO] A biblioteca 'piper-tts' não está instalada.")
    print("Execute: pip install piper-tts")
    sys.exit(1)

# --- CONFIGURAÇÕES DO ROBÔ (SINCRONIZADO COM TIRILO.PY) ---
PASTA_VOZES = os.path.expanduser("~/projeto_robo/robo_tirilo/vozes_piper")
DISPOSITIVO_AUDIO = "plughw:CARD=M1A,DEV=0"
FRASE_PADRAO = "Olá, eu sou o Tirilo, seu amigo robô! Estou testando minha nova voz neural local."
PORTA_UDP_TIRILO = 5050

# --- CATÁLOGO DE VOZES PT-BR (PIPER / HUGGING FACE) ---
BASE_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR"
CATALOGO_VOZES = {
    "1": {"nome": "Faber (Médio)", "slug": "pt_BR-faber-medium", "path": "faber/medium"},
    "2": {"nome": "Edresson (Baixo/Rápido)", "slug": "pt_BR-edresson-low", "path": "edresson/low"},
    "3": {"nome": "Isabela (Médio - Feminina)", "slug": "pt_BR-isabela-medium", "path": "isabela/medium"},
    "4": {"nome": "Ricardo (Médio - Masculina)", "slug": "pt_BR-ricardo-medium", "path": "ricardo/medium"},
    "5": {"nome": "Cadu (Médio)", "slug": "pt_BR-cadu-medium", "path": "cadu/medium"},
}

def limpar_tela():
    os.system('clear')

def listar_vozes_locais():
    if not os.path.exists(PASTA_VOZES):
        os.makedirs(PASTA_VOZES, exist_ok=True)
    
    arquivos = [f for f in os.listdir(PASTA_VOZES) if f.endswith(".onnx")]
    return sorted(arquivos)

def baixar_voz(id_v):
    voz = CATALOGO_VOZES.get(id_v)
    if not voz:
        return False

    os.makedirs(PASTA_VOZES, exist_ok=True)
    
    for ext in [".onnx", ".onnx.json"]:
        nome_arquivo = f"{voz['slug']}{ext}"
        caminho_local = os.path.join(PASTA_VOZES, nome_arquivo)
        url = f"{BASE_URL}/{voz['path']}/{nome_arquivo}"
        
        print(f"-> Baixando {nome_arquivo}...")
        try:
            r = requests.get(url, stream=True)
            r.raise_for_status()
            with open(caminho_local, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"   [OK] Salvo em {caminho_local}")
        except Exception as e:
            print(f"   [ERRO] Falha ao baixar: {e}")
            return False
    return True

def enviar_para_tirilo_udp(texto):
    """Envia texto para o servidor UDP do tirilo.py na porta 5050."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(texto.encode('utf-8'), ('localhost', PORTA_UDP_TIRILO))
        print(f"[UDP] Texto enviado para Tirilo (Porta {PORTA_UDP_TIRILO})")
    except Exception as e:
        print(f"[ERRO UDP] {e}")

def falar(modelo_caminho, texto, velocidade=1.4):
    """Sintetiza e toca o áudio usando PiperVoice (igual ao tirilo.py)."""
    config_caminho = modelo_caminho + ".json"
    if not os.path.exists(config_caminho):
        print(f"[ERRO] Configuração não encontrada: {config_caminho}")
        return

    print(f"\n[SÍNTESE] Inicializando PiperVoice...")
    print(f"   Modelo: {os.path.basename(modelo_caminho)}")
    print(f"   Velocidade: {velocidade}")
    
    try:
        # Carrega o modelo (Lógica do tirilo.py:161)
        voice = PiperVoice.load(modelo_caminho, config_path=config_caminho, use_cuda=False)
        voice.config.length_scale = velocidade # Controla velocidade
        
        # Gera áudio para arquivo WAV temporário (Lógica do tirilo.py:1208)
        temp_wav = "/tmp/teste_voz_piper.wav"
        with wave.open(temp_wav, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(voice.config.sample_rate)
            for chunk in voice.synthesize(texto):
                wav_file.writeframes(chunk.audio_int16_bytes)
        
        # Toca no hardware (Lógica do tirilo.py:1233)
        print(f"[PLAYBACK] Enviando áudio para {DISPOSITIVO_AUDIO}...")
        subprocess.run(
            ["aplay", "-q", "-D", DISPOSITIVO_AUDIO, temp_wav],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        
    except Exception as e:
        print(f"[ERRO CRÍTICO] Falha na síntese/playback: {e}")

def menu_principal():
    velocidade = 1.4
    while True:
        limpar_tela()
        print("==========================================")
        print("   TESTE DE VOZES PIPER - ROBÔ TIRILO")
        print("==========================================")
        print(f" Velocidade Atual: {velocidade} (Maior = Mais Lento)")
        print("------------------------------------------")
        
        local = listar_vozes_locais()
        if local:
            print("Vozes Instaladas:")
            for i, v in enumerate(local, 1):
                print(f" {i}. [INSTALADA] {v}")
        else:
            print(" (Nenhuma voz encontrada em vozes_piper)")
        
        print("\nOpções:")
        print(" n. Baixar nova voz do catálogo")
        print(" v. Alterar velocidade")
        print(" u. Testar fala via Tirilo (UDP 5050)")
        print(" s. Sair")
        
        op = input("\nEscolha (ou número da voz para testar): ").strip().lower()
        
        if op == 's':
            print("Até logo!")
            break
        
        elif op == 'u':
            txt = input("\nO que o Tirilo deve dizer via UDP? ").strip()
            if txt:
                enviar_para_tirilo_udp(txt)
                time.sleep(2)
        
        elif op == 'v':
            nova_vel = input(f"Digite a nova velocidade (atual {velocidade}): ").strip()
            try:
                velocidade = float(nova_vel)
            except:
                print("Valor inválido.")
                time.sleep(1)
        
        elif op == 'n':
            while True:
                limpar_tela()
                print("--- CATÁLOGO DE VOZES (PT-BR) ---")
                for k, v in CATALOGO_VOZES.items():
                    print(f" {k}. {v['nome']}")
                print(" v. Voltar")
                
                escolha_bv = input("\nQual voz deseja baixar? ").strip().lower()
                if escolha_bv == 'v':
                    break
                if baixar_voz(escolha_bv):
                    print("\nDownload concluído!")
                    time.sleep(2)
                    break
                else:
                    input("\nErro ao baixar. Pressione Enter para voltar.")
                    break
        
        elif op.isdigit():
            idx = int(op) - 1
            if 0 <= idx < len(local):
                voz_selecionada = os.path.join(PASTA_VOZES, local[idx])
                limpar_tela()
                print(f"Testando: {local[idx]}")
                print("------------------------------------------")
                print(" 1. Usar frase padrão")
                print(" 2. Digitar texto personalizado")
                print(" v. Voltar")
                
                op_t = input("\nEscolha: ").strip().lower()
                if op_t == '1':
                    falar(voz_selecionada, FRASE_PADRAO, velocidade)
                elif op_t == '2':
                    txt = input("\nO que o Tirilo deve dizer? ").strip()
                    if txt:
                        falar(voz_selecionada, txt, velocidade)
                
                if op_t in ['1', '2']:
                    input("\nPressione Enter para continuar...")
            else:
                print("Voz não encontrada.")
                time.sleep(1)

if __name__ == "__main__":
    menu_principal()
