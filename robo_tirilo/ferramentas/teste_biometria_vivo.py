import os
import subprocess
import time
import wave
import numpy as np
import sherpa_onnx

PASTA_BASE = "/home/boreto/projeto_robo/robo_tirilo/biometria"
MODELO = os.path.join(PASTA_BASE, "wespeaker_en_voxceleb_resnet34.onnx")
DISPOSITIVO = "default"

def carregar_extrator():
    config = sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=MODELO, num_threads=2)
    return sherpa_onnx.SpeakerEmbeddingExtractor(config)

def extrair_emb(extractor, samples):
    stream = extractor.create_stream()
    stream.accept_waveform(16000, samples)
    return np.array(extractor.compute(stream), dtype=np.float32)

def calcular_sim(alvo, atual):
    return np.dot(alvo, atual) / (np.linalg.norm(alvo) * np.linalg.norm(atual))

def testar_vivo():
    print("\n--- 🕵️ SUPER SCANNER DE BIOMETRIA (v1.2) ---")
    
    extractor = carregar_extrator()
    path_perfil = os.path.join(PASTA_BASE, "perfil_admin.bin")
    
    if not os.path.exists(path_perfil):
        print("❌ Erro: Perfil admin não encontrado.")
        return

    emb_alvo = np.fromfile(path_perfil, dtype=np.float32)
    
    while True:
        print("\n1. 🎤 Iniciar Escaneamento (7 segundos)")
        print("2. 🚪 Sair")
        opcao = input("Opção: ")
        
        if opcao == "2": break
        
        wav_teste = "/tmp/teste_vivo.wav"
        print("🎙️ Ouvindo... (Fale uma frase longa como: 'Tirilo, eu sou o seu administrador e estou testando sua voz')")
        subprocess.run(["pkill", "-9", "arecord"], stderr=subprocess.DEVNULL)
        subprocess.run(["arecord", "-D", DISPOSITIVO, "-f", "S16_LE", "-r", "16000", "-d", "7", "-c", "1", wav_teste])
        
        with wave.open(wav_teste, "rb") as f:
            raw_data = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        
        # 🧪 DIAGNÓSTICO MULTI-MÉTODO
        # Método 1: Som Bruto
        score_base = calcular_sim(emb_alvo, extrair_emb(extractor, raw_data))
        
        # Método 2: Normalização de Pico
        peak_norm = raw_data / (np.max(np.abs(raw_data)) + 1e-6)
        score_peak = calcular_sim(emb_alvo, extrair_emb(extractor, peak_norm))
        
        # Método 3: Normalização RMS (Energia)
        rms = np.sqrt(np.mean(raw_data**2))
        rms_norm = raw_data / (rms * 10 + 1e-6) # Normaliza pela energia média
        score_rms = calcular_sim(emb_alvo, extrair_emb(extractor, rms_norm))
        
        print("\n" + "="*45)
        print("📊 RELATÓRIO TÉCNICO DE BIOMETRIA")
        print("="*45)
        print(f"🔹 Energia Média (RMS): {rms:.6f}")
        print(f"🔹 Score (Bruto):       {score_base:.4f}")
        print(f"🔹 Score (Pico):        {score_peak:.4f} ✨")
        print(f"🔹 Score (Energia):     {score_rms:.4f}")
        print("="*45)
        
        melhor_score = max(score_base, score_peak, score_rms)
        if melhor_score > 0.70:
            print("✅ SUCESSO: BIOMETRIA VALIDADA!")
        else:
            print("❌ REPROVADO: SCORE ABAIXO DE 0.70")
            print("💡 DICA: Fale mais devagar e perto do peito do Tirilo.")
        print("="*45)

if __name__ == "__main__":
    try: testar_vivo()
    except KeyboardInterrupt: print("\nEncerrado.")
