#!/bin/bash
# 01_update_system.sh
# Atualiza os repositórios do Debian e instala ferramentas base.

echo "=== [1/5] ATUALIZAÇÃO DO SISTEMA ==="

# 1. Atualizar listas de pacotes
echo "-> Atualizando repositórios..."
sudo apt update

# 2. Upgrade dos pacotes instalados
echo "-> Aplicando upgrades..."
sudo apt upgrade -y

# 3. Instalar utilitários essenciais e drivers de vídeo para OS Lite
echo "-> Instalando ferramentas base e suporte a vídeo (DRM/KMS)..."
sudo apt install -y git vim wget curl p7zip-full i2c-tools build-essential python3-dev python3-pip flac \
    libegl1-mesa-dev libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-ttf-dev libgles2-mesa-dev \
    libgbm-dev libdrm-dev kmscube python3-pygame python3-opencv

# 4. Configurar permissões de hardware para o usuário
echo "-> Configurando permissões de usuário (video, render, i2c)..."
sudo usermod -a -G audio,video,render,i2c,gpio $USER

echo "-> Limpando arquivos temporários..."
sudo apt autoremove -y
sudo apt clean

echo "=== SISTEMA ATUALIZADO COM SUCESSO ==="
echo "Dica: Execute o próximo script: ./02_setup_audio.sh"
