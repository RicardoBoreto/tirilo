#!/bin/bash
# 02_setup_audio.sh
# Configura subsistema de áudio (ALSA) e dependências de voz.

echo "=== [2/5] CONFIGURAÇÃO DE ÁUDIO E VOZ ==="

# 1. Instalar pacotes de áudio ALSA e ferramentas
echo "-> Instalando ALSA utilitários e codecs..."
sudo apt install -y alsa-utils mpg123 libasound2-dev libportaudio2 portaudio19-dev

# 2. Instalar espeak-NG (Voz Offline)
echo "-> Instalando espeak-ng..."
sudo apt install -y espeak-ng

# 3. Instalar python3-pyaudio (necessário para VAD — gravação com detecção de silêncio)
echo "-> Instalando python3-pyaudio (VAD)..."
sudo apt install -y python3-pyaudio

# 4. Ajustar permissões para o usuário atual (audio group)
echo "-> Ajustando permissões de áudio..."
sudo usermod -a -G audio $USER

echo "=== CONFIGURAÇÃO DE ÁUDIO CONCLUÍDA ==="
echo "Sugestão: Teste o som com 'speaker-test -D plughw:2,0 -t wav -c 2' ou conecte seu M1A."
echo "Próximo passo: ./03_setup_hardware.sh"
