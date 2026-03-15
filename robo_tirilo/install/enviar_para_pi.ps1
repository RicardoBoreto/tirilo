$DEST_USER = "boreto"
$DEST_HOST = "100.123.54.24"
$DEST_DIR  = "/home/boreto/projeto_robo/robo_tirilo"
$SOURCE_DIR = "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo"

Write-Host ""
Write-Host "=== ENVIAR ROBO TIRILO -> RASPBERRY PI ===" -ForegroundColor Cyan
Write-Host "  Destino : $DEST_USER@$DEST_HOST"
Write-Host "  Pasta   : $DEST_DIR"
Write-Host ""

# 1. Limpa o diretorio remoto antes de copiar
Write-Host ">>> Limpando diretorio remoto..." -ForegroundColor Yellow
ssh "${DEST_USER}@${DEST_HOST}" "rm -rf $DEST_DIR && mkdir -p $DEST_DIR"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Nao foi possivel acessar o Pi via SSH." -ForegroundColor Red
    exit 1
}

# 2. Copia todos os arquivos do robo_tirilo
Write-Host ">>> Copiando arquivos..." -ForegroundColor Yellow
scp -r "${SOURCE_DIR}\*" "${DEST_USER}@${DEST_HOST}:${DEST_DIR}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO durante a copia dos arquivos." -ForegroundColor Red
    exit 1
}

# 3. Copia o .env.local (credenciais)
$ENV_LOCAL = "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo\.env.local"
if (Test-Path $ENV_LOCAL) {
    Write-Host ">>> Enviando .env.local..." -ForegroundColor Yellow
    scp "$ENV_LOCAL" "${DEST_USER}@${DEST_HOST}:${DEST_DIR}/.env.local"
} else {
    Write-Host "AVISO: .env.local nao encontrado em $ENV_LOCAL" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "=== CONCLUIDO! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o robo manualmente:" -ForegroundColor Cyan
Write-Host "  ssh $DEST_USER@$DEST_HOST"
Write-Host "  cd $DEST_DIR"
Write-Host "  python3 tirilo.py"
Write-Host ""
Write-Host "Para reativar o servico systemd:" -ForegroundColor Cyan
Write-Host ('  ssh ' + $DEST_USER + '@' + $DEST_HOST + ' ''sudo systemctl enable tirilo && sudo systemctl start tirilo''')
