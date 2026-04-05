#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import sherpa_onnx
import numpy as np

def gravar_audio(arquivo, duracao=12):
    """Grava áudio usando arecord (mesmo hardware do Tirilo)."""
    print(f"\n🎙️  INICIANDO GRAVAÇÃO DE {duracao} SEGUNDOS...")
    print("Diga frases naturais, como: 'Eu sou o administrador deste robô' ou 'Tirilo, reconheça minha voz'.")
    time.sleep(1)
    
    # Busca o dispositivo configurado no tirilo.py (Emeete M1A)
    # Por padrão, usaremos plughw:CARD=M1A,DEV=0 ou o padrão do sistema
    dispositivo = "plughw:CARD=M1A,DEV=0"
    
    try:
        cmd = [
            "arecord", "-D", dispositivo, "-f", "S16_LE", "-r", "16000", 
            "-d", str(duracao), "-c", "1", arquivo
        ]
        subprocess.run(cmd, check=True)
        print("✅ Gravação concluída com sucesso.")
    except Exception as e:
        print(f"❌ Erro ao gravar: {e}. Verifique se o microfone está conectado.")
        sys.exit(1)

def extrair_embedding(modelo_path, audio_path):
    """Extrai o vetor de identidade (embedding) da voz usando sherpa-onnx."""
    config = sherpa_onnx.SpeakerEmbeddingExtractorConfig(
        model=modelo_path,
        num_threads=2,
        debug=False
    )
    extractor = sherpa_onnx.SpeakerEmbeddingExtractor(config)
    
    # Carrega áudio WAV
    import wave
    with wave.open(audio_path, 'rb') as f:
        samples = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    
    embedding = extractor.compute(extractor.create_stream(), samples)
    return embedding

def main():
    print("====================================================")
    print("      CADASTRO DE BIOMETRIA VOCAL - TIRILO         ")
    print("====================================================")
    
    PASTA_BASE = "/home/boreto/projeto_robo/robo_tirilo/biometria"
    MODELO = os.path.join(PASTA_BASE, "wespeaker_en_voxceleb_resnet34.onnx")
    
    if not os.path.exists(MODELO):
        print(f"❌ Erro: Modelo não encontrado em {MODELO}")
        print("Aguarde o download do modelo terminar antes de rodar este script.")
        return

    print("\nEscolha o perfil para cadastrar:")
    print("1. ADMINISTRADOR")
    print("2. TERAPEUTA")
    opcao = input("Digite 1 ou 2: ")
    
    nome_perfil = "admin" if opcao == "1" else "terapeuta"
    arquivo_wav = os.path.join(PASTA_BASE, f"temp_{nome_perfil}.wav")
    arquivo_bin = os.path.join(PASTA_BASE, f"perfil_{nome_perfil}.bin")
    
    gravar_audio(arquivo_wav)
    
    print("\n🧠 Processando biometria...")
    try:
        embedding = extrair_embedding(MODELO, arquivo_wav)
        # Salva o embedding em binário
        embedding.tofile(arquivo_bin)
        print(f"✨ PERFIL {nome_perfil.upper()} SALVO COM SUCESSO!")
        print(f"Arquivo: {arquivo_bin}")
        
        # Remove o WAV temporário por privacidade
        # os.remove(arquivo_wav)
    except Exception as e:
        print(f"❌ Erro ao processar biometria: {e}")

if __name__ == "__main__":
    main()
