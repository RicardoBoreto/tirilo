#!/bin/bash
# 03_setup_hardware.sh
# Habilita I2C e configura permissões para o hardware do Tirilo (PCA9685).

echo "=== [3/5] CONFIGURAÇÃO DE HARDWARE (I2C/GPIO) ==="

# 1. Habilitar I2C no Raspberry Pi (não-interativo)
echo "-> Habilitando interface I2C..."
sudo raspi-config nonint do_i2c 0

# 2. Instalar bibliotecas de sistema para I2C e GPIO
echo "-> Instalando gpiod e dependências I2C..."
sudo apt install -y i2c-tools python3-libgpiod gpiod

# 3. Adicionar o usuário ao grupo i2c e gpio
echo "-> Ajustando permissões de hardware..."
sudo usermod -a -G i2c $USER
sudo usermod -a -G gpio $USER

echo "=== CONFIGURAÇÃO DE HARDWARE CONCLUÍDA ==="
echo "Dica: Execute 'i2cdetect -y 1' para verificar se o PCA9685 (0x40) foi detectado."
echo "Próximo passo: ./04_setup_python_libs.sh"
