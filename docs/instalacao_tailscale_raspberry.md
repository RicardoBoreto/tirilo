# 1. Atualiza o sistema
sudo apt update && sudo apt upgrade -y

# 2. Instala dependências
sudo apt install -y curl gnupg

# 3. Adiciona chave GPG (método atual)
curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null

# 4. Adiciona repositório (Bookworm = versão atual; troque por bullseye se for sistema antigo)
echo "deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://pkgs.tailscale.com/stable/debian bookworm main" | sudo tee /etc/apt/sources.list.d/tailscale.list

# 5. Instala o Tailscale
sudo apt update
sudo apt install tailscale -y

# 6. Inicia e autentica (escolha uma das 3 opções abaixo)

# Opção A – QR Code (mais fácil)
sudo tailscale up --qr

# Opção B – Link no celular/notebook  // usei este
sudo tailscale up

# Opção C – Chave automática (ideal para muitos Pis)
# (gere a chave em https://login.tailscale.com/admin/machines → Reusable)
sudo tailscale up --authkey=tskey-auth-kSEU-CODIGO-AQUI

# 7. Ativa na inicialização (sempre rode isso)
sudo systemctl enable --now tailscaled.service