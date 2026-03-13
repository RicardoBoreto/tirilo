#!/bin/bash
# 05_setup_camera.sh
# Configura a câmera e instala dependências OpenCV para o Pi 5.

echo "=== [5/5] CONFIGURAÇÃO DE CÂMERA E VISÃO ==="

# 1. Instalar dependências de sistema para OpenCV, libcamera e GStreamer
echo "-> Instalando libcamera, v4l-utils e GStreamer..."
sudo apt install -y libcamera-v4l2 rpicam-apps libopencv-dev python3-opencv v4l-utils \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good gstreamer1.0-libcamera \
    python3-picamera2

# 2. Instalar flask para visualização web
echo "-> Instalando Flask..."
sudo python3 -m pip install flask --break-system-packages

# 3. Baixar modelos Haar Cascade (setup_visao.py)
echo "-> Baixando modelos de Visão Computacional..."
cd ..
python3 setup_visao.py
cd install

echo "=== CONFIGURAÇÃO DE CÂMERA CONCLUÍDA ==="
echo "Dica: Teste com 'rpicam-hello' ou 'python3 ../rastreador_visao_web.py'."
echo "=== TODAS AS ETAPAS DE INSTALAÇÃO FORAM CONCLUÍDAS ==="
