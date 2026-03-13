#!/bin/bash
# 06_setup_tailscale.sh
# Instala o Tailscale para acesso remoto seguro.

echo "=== [6/6] INSTALAÇÃO DO TAILSCALE (ACESSO REMOTO) ==="

# 1. Instalação via script oficial da Tailscale
echo "-> Baixando e instalando Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

echo "=== TAILSCALE INSTALADO COM SUCESSO ==="
echo ""
echo "PRÓXIMO PASSO OBRIGATÓRIO:"
echo "Você precisa autenticar este Raspberry Pi na sua rede Tailscale."
echo "Execute o comando abaixo e siga as instruções no link que aparecer:"
echo ""
echo "    sudo tailscale up"
echo ""
echo "Após a autenticação, você poderá acessar o Tirilo de qualquer lugar usando o IP da Tailscale."
