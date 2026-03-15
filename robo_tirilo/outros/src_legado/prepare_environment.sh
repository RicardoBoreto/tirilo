#!/bin/bash
# prepare_enviroment.sh
# Script para limpar e normalizar o ambiente Python no Linux após o deploy.

APP_DIR="."

echo "=== PREPARANDO AMBIENTE DO ROBO ==="

# 1. Limpeza de Caches (Força recompilação dos .pyc)
echo "-> Limpando __pycache__..."
find "$APP_DIR" -name "__pycache__" -type d -exec rm -rf {} +
find "$APP_DIR" -name "*.pyc" -delete

# 2. Definição de Locale (Garante que o Python saiba que é UTF-8)
# Isso ajuda se o SSH session estiver sem LANG definido
export LANG=pt_BR.UTF-8
export LC_ALL=pt_BR.UTF-8

# 3. Normalização de Encoding (Safety Net)
# Se houver arquivos que chegaram como ISO-8859-1 (Latin1), convertemos para UTF-8.
# Usamos 'file' para detectar e 'iconv' para converter.
echo "-> Verificando Encoding dos arquivos .py..."

find "$APP_DIR" -name "*.py" | while read file; do
    # Verifica o tipo de encoding reportado pelo Linux
    encoding=$(file -bi "$file" | sed -e 's/.*[ ]charset=//')
    
    if [ "$encoding" != "utf-8" ] && [ "$encoding" != "us-ascii" ] && [ "$encoding" != "binary" ]; then
        echo "   [FIX] Convertendo $file de $encoding para utf-8..."
        # Cria temporário
        iconv -f "$encoding" -t utf-8 "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi
done

echo "=== AMBIENTE PRONTO ==="
