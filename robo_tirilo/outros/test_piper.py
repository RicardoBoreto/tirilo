import os
import time
import sys
import wave

# Tenta importar a biblioteca piper instalada
try:
    from piper.voice import PiperVoice
except ImportError:
    print("ERRO: A biblioteca 'piper-tts' não foi encontrada.")
    print("💡 Instale com: pip3 install piper-tts --break-system-packages")
    sys.exit(1)

# --- CONFIGURAÇÕES ---
DISPOSITIVO_AUDIO = "plughw:CARD=M1A,DEV=0"
MODELO_VOZ = "pt_BR-faber-medium.onnx"
ARQUIVO_SAIDA = "teste_piper.wav"

def testar_performance_piper():
    print(f"🚀 Iniciando teste de performance do Piper (Modo Persistente)")
    
    if not os.path.exists(MODELO_VOZ):
        print(f"ERRO: Modelo {MODELO_VOZ} não encontrado na pasta atual.")
        return

    # 1. CARREGAMENTO DO MODELO (Cold Start)
    print(f"\n[1/3] ⬇️ Carregando modelo na RAM... (Isso acontece apenas no boot do robô)")
    start_load = time.time()
    
    voice = PiperVoice.load(MODELO_VOZ, config_path=MODELO_VOZ + ".json", use_cuda=False)
    
    load_duration = time.time() - start_load
    print(f"✅ Modelo carregado em {load_duration:.2f}s")

    # 2. TESTE 1 (Primeira fala - Warm up)
    frase1 = "Olá! Esta é a minha primeira frase. Estou aquecendo os motores neurais."
    print(f"\n[2/3] 🎤 Teste 1: '{frase1}'")
    
    start_t1 = time.time()
    with wave.open(ARQUIVO_SAIDA, "wb") as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(voice.config.sample_rate)
        # Captura os bytes corretos do chunk
        for chunk in voice.synthesize(frase1):
            wav_file.writeframes(chunk.audio_int16_bytes)
    
    t1_duration = time.time() - start_t1
    print(f"⚡ Tempo de síntese 1: {t1_duration:.2f}s")
    
    # Reproduz
    os.system(f"aplay -q -D {DISPOSITIVO_AUDIO} {ARQUIVO_SAIDA}")

    # 3. TESTE 2 (Segunda fala - Performance Real)
    frase2 = "E agora eu falo muito mais rápido, sem precisar carregar o arquivo novamente!"
    print(f"\n[3/3] 🎤 Teste 2: '{frase2}'")
    
    start_t2 = time.time()
    with wave.open(ARQUIVO_SAIDA, "wb") as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(voice.config.sample_rate)
        for chunk in voice.synthesize(frase2):
            wav_file.writeframes(chunk.audio_int16_bytes)
    
    t2_duration = time.time() - start_t2
    print(f"🚀 Tempo de síntese 2: {t2_duration:.2f}s")
    
    # Reproduz
    os.system(f"aplay -q -D {DISPOSITIVO_AUDIO} {ARQUIVO_SAIDA}")

    print("\n" + "="*50)
    print(f"RESUMO DE PERFORMANCE:")
    print(f"Carga Inicial (RAM): {load_duration:.2f}s")
    print(f"Latência T1 (Frio): {t1_duration:.2f}s")
    print(f"Latência T2 (Quente): {t2_duration:.2f}s <--- ESSA É A VELOCIDADE NO DIA A DIA")
    print("="*50)

if __name__ == "__main__":
    testar_performance_piper()
