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

# 4. Preparar diretório de vozes Piper e baixar modelo padrão
echo "-> Preparando diretório de vozes Piper e modelo padrão..."
PIPER_DIR="$HOME/projeto_robo/robo_tirilo/vozes_piper"
mkdir -p "$PIPER_DIR"

if [ ! -f "$PIPER_DIR/pt_BR-faber-medium.onnx" ]; then
    echo "-> Baixando modelo de voz Piper (Faber Medium)..."
    wget -q --show-progress -O "$PIPER_DIR/pt_BR-faber-medium.onnx" "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx"
    wget -q --show-progress -O "$PIPER_DIR/pt_BR-faber-medium.onnx.json" "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json"
fi

# 5. Preparar diretório e modelo de Biometria Vocal (sherpa-onnx / wespeaker)
echo "-> Preparando diretório de biometria..."
BIOMETRIA_DIR="$HOME/projeto_robo/robo_tirilo/biometria"
mkdir -p "$BIOMETRIA_DIR"

MODELO_BIOMETRIA="$BIOMETRIA_DIR/wespeaker_en_voxceleb_resnet34.onnx"
if [ ! -f "$MODELO_BIOMETRIA" ]; then
    echo "-> Baixando modelo de identificação de voz (wespeaker VoxCeleb ResNet34)..."
    wget -q --show-progress \
        -O "$MODELO_BIOMETRIA" \
        "https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recog-models/wespeaker_en_voxceleb_resnet34.onnx"
    if [ $? -eq 0 ]; then
        echo "   Modelo baixado: $MODELO_BIOMETRIA"
    else
        echo "   AVISO: Falha ao baixar o modelo de biometria."
        echo "   Baixe manualmente e coloque em: $MODELO_BIOMETRIA"
        echo "   URL: https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recog-models/wespeaker_en_voxceleb_resnet34.onnx"
    fi
else
    echo "   Modelo de biometria já existe: $MODELO_BIOMETRIA"
fi

echo ""
echo "   IMPORTANTE: Após instalar o robô, cadastre os perfis de voz:"
echo "   python3 ferramentas/biometria_setup_gui.py   (interface gráfica touchscreen)"
echo "   python3 ferramentas/biometria_setup.py        (terminal)"

echo "=== BIBLIOTECAS PYTHON INSTALADAS ==="
echo "Dica: Agora você pode rodar o programa diretamente com 'python3 tirilo.py'"
echo "Próximo passo: ./05_setup_camera.sh"
