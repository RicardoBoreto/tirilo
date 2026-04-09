import os
import wave
import numpy as np
import sherpa_onnx
import sys

PASTA_BASE = "/home/boreto/projeto_robo/robo_tirilo/biometria"
MODELO = os.path.join(PASTA_BASE, "wespeaker_en_voxceleb_resnet34.onnx")

def extrair_embedding(extractor, wav_path):
    with wave.open(wav_path, "rb") as f:
        rate = f.getframerate()
        raw_samples = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        
        # Resampling 48k -> 16k
        if rate == 48000:
            samples = raw_samples[::3]
            rate = 16000
        else:
            samples = raw_samples
            
        stream = extractor.create_stream()
        stream.accept_waveform(rate, samples)
        return np.array(extractor.compute(stream), dtype=np.float32)

def diagnosticar():
    if not os.path.exists(MODELO):
        print("Erro: Modelo não encontrado.")
        return

    config = sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=MODELO, num_threads=2)
    extractor = sherpa_onnx.SpeakerEmbeddingExtractor(config)

    path_perfil = os.path.join(PASTA_BASE, "perfil_admin.bin")
    path_ultimo = "/tmp/ultima_fala.wav"

    if not os.path.exists(path_perfil):
        print(f"Erro: Perfil admin não encontrado em {path_perfil}")
        return
    if not os.path.exists(path_ultimo):
        print(f"Erro: Última fala não encontrada em {path_ultimo}")
        return

    emb_alvo = np.fromfile(path_perfil, dtype=np.float32)
    emb_atual = extrair_embedding(extractor, path_ultimo)

    similarity = np.dot(emb_alvo, emb_atual) / (np.linalg.norm(emb_alvo) * np.linalg.norm(emb_atual))
    
    print("\n" + "="*40)
    print("📊 DIAGNÓSTICO DE BIOMETRIA")
    print("="*40)
    print(f"Arquivo Perfil: {path_perfil}")
    print(f"Arquivo Teste : {path_ultimo}")
    print(f"Score Encontrado: {similarity:.4f}")
    print("="*40)
    if similarity > 0.82:
        print("✅ Resultado: SERIA AUTORIZADO")
    else:
        print("❌ Resultado: NEGADO")
    print("="*40 + "\n")

if __name__ == "__main__":
    diagnosticar()
