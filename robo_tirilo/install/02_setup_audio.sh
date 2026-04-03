#!/bin/bash
# 02_setup_audio.sh
# Configura subsistema de áudio (ALSA) para EMEET Office Core M1A (E1102) + dependências de voz.

echo "=== [2/5] CONFIGURAÇÃO DE ÁUDIO E VOZ ==="

# 1. Instalar pacotes de áudio ALSA e ferramentas
echo "-> Instalando ALSA utilitários e codecs..."
sudo apt install -y alsa-utils mpg123 sox libasound2-dev libportaudio2 portaudio19-dev

# 2. Instalar espeak-NG (Voz Offline)
echo "-> Instalando espeak-ng..."
sudo apt install -y espeak-ng

# 3. Instalar python3-pyaudio (necessário para VAD — gravação com detecção de silêncio)
echo "-> Instalando python3-pyaudio (VAD)..."
sudo apt install -y python3-pyaudio

# 4. Ajustar permissões para o usuário atual (audio group)
echo "-> Ajustando permissões de áudio..."
sudo usermod -a -G audio $USER

# 5. Configurar EMEET M1A como dispositivo ALSA padrão
echo "-> Configurando EMEET OfficeCore M1A como dispositivo de áudio padrão..."
sudo tee /etc/asound.conf > /dev/null << 'EOF'
# ALSA default: EMEET Office Core M1A (E1102)
pcm.!default {
    type asym
    playback.pcm {
        type plug
        slave.pcm "hw:CARD=M1A,DEV=0"
    }
    capture.pcm {
        type plug
        slave.pcm "hw:CARD=M1A,DEV=0"
    }
}
ctl.!default {
    type hw
    card M1A
}
EOF

# 6. Ajustar volume para 100% (persiste via alsactl)
echo "-> Ajustando volume do EMEET para 100%..."
sleep 1
amixer -c M1A sset Speaker 100% 2>/dev/null || true
amixer -c M1A sset Mic 100% 2>/dev/null || true
sudo alsactl store

echo ""
echo "=== CONFIGURAÇÃO DE ÁUDIO CONCLUÍDA ==="
echo "Teste de reprodução : aplay -D plughw:CARD=M1A,DEV=0 /usr/share/sounds/alsa/Front_Center.wav"
echo "Teste de gravação   : arecord -D plughw:CARD=M1A,DEV=0 -f S16_LE -r 48000 -c 1 -d 3 /tmp/teste.wav && aplay /tmp/teste.wav"
echo "Próximo passo: ./03_setup_hardware.sh"
