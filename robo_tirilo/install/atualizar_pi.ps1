$DEST_USER = "boreto"
$DEST_HOST = "100.123.54.24"
$DEST_DIR  = "/home/boreto/projeto_robo/robo_tirilo"
$SOURCE_DIR = "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo"

Write-Host ""
Write-Host "=== ATUALIZAR ROBO TIRILO -> RASPBERRY PI ===" -ForegroundColor Cyan
Write-Host "  Destino : $DEST_USER@$DEST_HOST"
Write-Host "  Pasta   : $DEST_DIR"
Write-Host ""

$erros = 0

function Enviar($origem, $destino, $label) {
    Write-Host "  >>> $label" -ForegroundColor Yellow
    scp -r $origem "${DEST_USER}@${DEST_HOST}:${destino}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERRO ao enviar $label" -ForegroundColor Red
        $script:erros++
    }
}

# --- Arquivos principais ---
Write-Host "[1/5] Arquivos principais..." -ForegroundColor White
Enviar "$SOURCE_DIR\tirilo.py"       "$DEST_DIR/tirilo.py"       "tirilo.py"
Enviar "$SOURCE_DIR\olhos_tirilo.py" "$DEST_DIR/olhos_tirilo.py" "olhos_tirilo.py"

# --- Modulos src/ (cloud, brain) ---
Write-Host "[2/5] Modulos src/..." -ForegroundColor White
Enviar "$SOURCE_DIR\src" "$DEST_DIR/" "src/"

# --- Jogos ---
Write-Host "[3/5] Jogos..." -ForegroundColor White
Enviar "$SOURCE_DIR\jogos" "$DEST_DIR/" "jogos/"

# --- Ferramentas ---
Write-Host "[4/5] Ferramentas..." -ForegroundColor White
Enviar "$SOURCE_DIR\ferramentas" "$DEST_DIR/" "ferramentas/"

# --- .env.local ---
Write-Host "[5/5] Credenciais..." -ForegroundColor White
$ENV_LOCAL = "$SOURCE_DIR\.env.local"
if (Test-Path $ENV_LOCAL) {
    Enviar $ENV_LOCAL "$DEST_DIR/.env.local" ".env.local"
} else {
    Write-Host "      (sem .env.local local - mantendo o do Pi)" -ForegroundColor DarkGray
}

# --- Resultado ---
Write-Host ""
if ($erros -eq 0) {
    Write-Host "=== ATUALIZACAO CONCLUIDA! ===" -ForegroundColor Green
} else {
    Write-Host "=== CONCLUIDO COM $erros ERRO(S) ===" -ForegroundColor Red
}

# --- Reiniciar servico? ---
Write-Host ""
$restart = Read-Host "Reiniciar o servico tirilo no Pi? (s/N)"
if ($restart -eq "s" -or $restart -eq "S") {
    Write-Host "Reiniciando tirilo.service..." -ForegroundColor Yellow
    ssh "${DEST_USER}@${DEST_HOST}" "sudo systemctl restart tirilo"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Servico reiniciado." -ForegroundColor Green
    } else {
        Write-Host "Erro ao reiniciar servico." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Para iniciar manualmente:" -ForegroundColor Cyan
    Write-Host "  ssh $DEST_USER@$DEST_HOST"
    Write-Host ('  cd ' + $DEST_DIR + ' && python3 tirilo.py')
}
Write-Host ""
