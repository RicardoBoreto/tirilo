$DEST_USER = "boreto"
$DEST_HOST = "192.168.1.112" # Pode substituir pelo IP (ex: "192.168.1.100")
$DEST_DIR = "~/projeto_robo"
$SOURCE_DIR = "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo"

Write-Host "=== SINCRONIZANDO ARQUIVOS COM O RASPBERRY PI ===" -ForegroundColor Cyan
Write-Host "Destino: $DEST_USER@$DEST_HOST : $DEST_DIR"

# Sincroniza a pasta do robô
scp -r "$SOURCE_DIR" "${DEST_USER}@${DEST_HOST}:${DEST_DIR}"

# Sincroniza o .env.local (um nível acima)
$ENV_LOCAL = Join-Path (Split-Path $SOURCE_DIR -Parent) ".env.local"
if (Test-Path $ENV_LOCAL) {
    Write-Host "Enviando .env.local..." -ForegroundColor Yellow
    scp "$ENV_LOCAL" "${DEST_USER}@${DEST_HOST}:${DEST_DIR}/.env.local"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO! ===" -ForegroundColor Green
    Write-Host "Agora acesse o Pi: ssh $DEST_USER@$DEST_HOST"
}
else {
    Write-Host "!!! ERRO DURANTE A SINCRONIZAÇÃO !!!" -ForegroundColor Red
}
