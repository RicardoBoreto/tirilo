#!/bin/bash
# setup_autostart_tirilo.sh
# Script para configurar o auto-start do Robo Tirilo como um serviço do sistema.

echo "--- CONFIGURANDO AUTO-START DO TIRILO ---"

# 1. Verifica se o arquivo de serviço existe
if [ ! -f "tirilo.service" ]; then
    echo "Erro: tirilo.service não encontrado na pasta atual."
    exit 1
fi

# 2. Copia para a pasta de serviços do sistema
echo "-> Copiando tirilo.service para /etc/systemd/system/..."
sudo cp tirilo.service /etc/systemd/system/

# 3. Recarrega o systemd
echo "-> Recarregando daemon do systemd..."
sudo systemctl daemon-reload

# 4. Habilita o serviço para o boot
echo "-> Habilitando serviço tirilo.service..."
sudo systemctl enable tirilo.service

# 5. Inicia o serviço agora
echo "-> Iniciando serviço tirilo.service..."
sudo systemctl restart tirilo.service

echo "-----------------------------------------"
echo "Concluído! O robô deve estar iniciando agora."
echo "Para ver os logs, use: journalctl -u tirilo.service -f"
echo "-----------------------------------------"
