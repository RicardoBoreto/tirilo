#!/bin/bash
# 04_setup_python_libs.sh
# Instala as dependências do Tirilo diretamente no sistema.

echo "=== [4/5] INSTALAÇÃO DE BIBLIOTECAS PYTHON (GLOBAL) ==="

# O Raspberry Pi OS Bookworm bloqueia o pip global por padrão.
# Como este é um sistema dedicado, usaremos --break-system-packages para simplificar.

# 0. Desinstalar Pygame do Pip (usaremos a versão do sistema)
echo "-> Removendo Pygame do Pip para evitar conflitos..."
sudo python3 -m pip uninstall -y pygame --break-system-packages

# 1. Instalar dependências do projeto (requirements.txt)
echo "-> Instalando dependências do projeto (requirements.txt)..."
if [ -f "../requirements.txt" ]; then
    sudo python3 -m pip install -r ../requirements.txt --break-system-packages
else
    echo "Aviso: requirements.txt não encontrado em ../"
fi

# 3. Instalar bibliotecas de hardware CircuitPython (PCA9685/Servos)
echo "-> Instalando Adafruit ServoKit e Blinka..."
sudo python3 -m pip install adafruit-circuitpython-servokit adafruit-blinka --break-system-packages

echo "=== BIBLIOTECAS PYTHON INSTALADAS ==="
echo "Dica: Agora você pode rodar o programa diretamente com 'python3 tiriloV324.py'"
echo "Próximo passo: ./05_setup_camera.sh"
