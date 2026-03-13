#!/bin/bash
# visao_tirilo.sh
# Wrapper de compatibilidade para rodar scripts de visão no Pi 5 com câmera CSI.

# Tenta localizar o wrapper de compatibilidade do libcamera
COMPAT_LIB="/usr/lib/aarch64-linux-gnu/libcamera/v4l2-compat.so"

if [ -f "$COMPAT_LIB" ]; then
    echo "-> Iniciando com Wrapper de Compatibilidade V4L2..."
    export LD_PRELOAD="$COMPAT_LIB"
fi

# Executa o script python passado como argumento (ou o rastreador padrão)
SCRIPT=${1:-"rastreador_tela.py"}
python3 "$SCRIPT"
