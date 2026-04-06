#!/usr/bin/env python3
"""
ARQUIVO: ferramentas/testar_vozes_sherpa.py
DESCRIÇÃO: Versão ultra-compatível que salva WAV usando a biblioteca padrão 'wave'.
AUTOR: Antigravity/Ricardo Alonso Boreto
DATA: 06/04/2026
"""

import os
import sys
import subprocess
import time
import requests
import tarfile
import wave
import numpy as np
from pathlib import Path

# Tenta carregar o Sherpa-ONNX
try:
    import sherpa_onnx
except ImportError:
    print("\n[ERRO] A biblioteca 'sherpa-onnx' não está instalada.")
    sys.exit(1)

# --- CONFIGURAÇÕES DO ROBÔ ---
PASTA_VOZES = os.path.expanduser("~/projeto_robo/robo_tirilo/vozes_sherpa")
DISPOSITIVO_AUDIO = "plughw:CARD=M1A,DEV=0"
FRASE_PADRAO = "Olá! Eu sou o Tirilo e este é o teste do motor Sherpa. Agora o áudio vai sair!"

# --- CATÁLOGO DE VOZES ---
CATALOGO_SHERPA = {
    "1": {
        "nome": "Faber (Medium) - Sherpa Ready",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2",
        "pasta": "vits-piper-pt_BR-faber-medium",
        "modelo": "pt_BR-faber-medium.onnx"
    },
    "2": {
        "nome": "Edresson (Low) - Sherpa Ready",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-edresson-low.tar.bz2",
        "pasta": "vits-piper-pt_BR-edresson-low",
        "modelo": "pt_BR-edresson-low.onnx"
    }
}

def limpar_tela():
    os.system('clear')

def baixar_e_extrair(id_v):
    voz = CATALOGO_SHERPA.get(id_v)
    if not voz: return
    os.makedirs(PASTA_VOZES, exist_ok=True)
    arquivo_tar = os.path.join(PASTA_VOZES, f"{voz['pasta']}.tar.bz2")
    print(f"-> Baixando {voz['nome']}...")
    try:
        r = requests.get(voz['url'], stream=True)
        r.raise_for_status()
        with open(arquivo_tar, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
        print("-> Extraindo...")
        with tarfile.open(arquivo_tar, "r:bz2") as tar:
            tar.extractall(path=PASTA_VOZES)
        os.remove(arquivo_tar)
        return True
    except Exception as e:
        print(f"[ERRO] {e}"); return False

def listar_modelos_sherpa():
    if not os.path.exists(PASTA_VOZES): return []
    modelos = []
    for d in sorted(os.listdir(PASTA_VOZES)):
        path_d = os.path.join(PASTA_VOZES, d)
        if os.path.isdir(path_d):
            onnx = [f for f in os.listdir(path_d) if f.endswith(".onnx")]
            if onnx: modelos.append({"pasta": d, "modelo": onnx[0]})
    return modelos

def falar_sherpa(pasta, modelo_nome, texto, velocidade=1.4):
    diretorio = os.path.join(PASTA_VOZES, pasta)
    modelo_path = os.path.join(diretorio, modelo_nome)
    tokens_path = os.path.join(diretorio, "tokens.txt")
    data_dir = os.path.join(diretorio, "espeak-ng-data")
    if not os.path.exists(data_dir):
        data_dir = "/usr/lib/arm-linux-gnueabihf/espeak-ng-data"

    print(f"\n[SÍNTESE - SHERPA] Gerando áudio...")
    try:
        vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
            model=modelo_path, tokens=tokens_path, data_dir=data_dir, length_scale=velocidade 
        )
        config = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(vits=vits_config, num_threads=2),
            max_num_sentences=1,
        )
        tts = sherpa_onnx.OfflineTts(config)
        
        start_time = time.time()
        audio = tts.generate(texto)
        end_time = time.time()
        
        print(f"[STATUS] Síntese em {(end_time - start_time):.3f}s")
        
        temp_wav = "/tmp/teste_sherpa_final.wav"
        
        # SALVAMENTO MANUAL VIA 'WAVE' (IDÊNTICO AO TIRILO.PY)
        samples = audio.samples
        if not isinstance(samples, np.ndarray):
            samples = np.array(samples)
            
        # Converte float32 (-1.0 a 1.0) para int16
        samples_int16 = (samples * 32767).astype(np.int16)
        
        with wave.open(temp_wav, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2) # 16-bit
            wf.setframerate(audio.sample_rate)
            wf.writeframes(samples_int16.tobytes())
        
        print(f"[PLAYBACK] Reproduzindo no hardware...")
        subprocess.run(["aplay", "-q", "-D", DISPOSITIVO_AUDIO, temp_wav])
    except Exception as e:
        print(f"[ERRO] {e}")

def menu():
    while True:
        limpar_tela()
        print("=== TESTE SHERPA-ONNX (CORRIGIDO) ===")
        modelos = listar_modelos_sherpa()
        if modelos:
            print("Modelos Disponíveis:")
            for i, m in enumerate(modelos, 1): print(f" {i}. {m['pasta']}")
        else:
            print("Nenhum modelo em /vozes_sherpa")
            
        print("\n(n) Baixar Nova, (s) Sair")
        op = input("\nEscolha: ").strip().lower()
        if op == 's': break
        elif op == 'n':
            for k, v in CATALOGO_SHERPA.items(): print(f" {k}. {v['nome']}")
            baixar_e_extrair(input("Qual baixar? "))
        elif op.isdigit():
            idx = int(op) - 1
            if 0 <= idx < len(modelos):
                m = modelos[idx]
                print(f"\nTestando: {m['pasta']}")
                txt = input(f"Digite o texto (Enter para padrão): ").strip()
                falar_sherpa(m['pasta'], m['modelo'], txt or FRASE_PADRAO)
                input("\nEnter para continuar...")

if __name__ == "__main__":
    menu()
