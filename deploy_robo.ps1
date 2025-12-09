# Deploy do Robô Tirilo para Raspberry Pi
# Uso: .\deploy_robo.ps1 -Ip 100.x.y.z -User pi

param(
    [Parameter(Mandatory = $false)]
    [string]$Ip = $env:ROBO_IP,

    [Parameter(Mandatory = $false)]
    [string]$User = $env:ROBO_USER,

    [Parameter(Mandatory = $false)]
    [string]$Path = "/home/$User/apps/tirilo_robo"
)

if (-not $Ip) {
    Write-Error "IP do robô não fornecido. Defina ROBO_IP no .env.local ou passe -Ip."
    exit 1
}

if (-not $User) {
    $User = "boreto"
}



# Recalcular caminho se o usuário foi detectado automaticamente e o Path ainda tem o valor padrão (que avaliou $User vazio)
if ($Path -eq "/home//apps/tirilo_robo" -or $Path -eq "/home/$env:ROBO_USER/apps/tirilo_robo") {
    $RemotePath = "/home/$User/apps/tirilo_robo"
}
else {
    $RemotePath = $Path
}
$LocalPath = ".\robo_tirilo\src\*"

Write-Host "Iniciando deploy para $User@$Ip..." -ForegroundColor Cyan
Write-Host "Destino: $RemotePath"

# 0. Verificar existência do SSH Client
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "Cliente SSH não encontrado. Instale o OpenSSH Client."
    exit 1
}

# Dica sobre autenticação
Write-Host "DICA: Para evitar digitar a senha, configure chaves SSH:" -ForegroundColor Yellow
Write-Host "  1. ssh-keygen -t ed25519" -ForegroundColor Gray
Write-Host "  2. type `$env:USERPROFILE\.ssh\id_ed25519.pub | ssh ${User}@${Ip} `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys`"" -ForegroundColor Gray
Write-Host ""

# 1. Empacotar e Enviar (Lote Único)
Write-Host "-> Sincronizando arquivos (tar pipe)..."

# Cria o diretório remoto primeiro (garantia)
# Usando tar para enviar src/ e requirements.txt preservando estrutura
# O comando local 'tar' envia para STDOUT, o 'ssh' recebe no STDIN e o 'tar' remoto extrai
try {
    # Check current dir context
    if (-not (Test-Path ".\robo_tirilo")) {
        Write-Error "Diretório 'robo_tirilo' não encontrado."
        exit 1
    }

    # Pipeline: tar local -> ssh -> tar remoto
    # Nota: Windows tar (bsdtar) funciona bem. Usar "/" para caminhos no tar para compatibilidade.
    # mkdir -p remoto garante que a pasta base existe.
    
    $RemoteCommand = "mkdir -p ${RemotePath} && tar -xvf - -C ${RemotePath}"
    
    # Executando comando único
    # CD para entrar na pasta raiz do projeto antes de tar
    tar -cf - -C .\robo_tirilo src requirements.txt | ssh "${User}@${Ip}" $RemoteCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Transferência concluída com sucesso." -ForegroundColor Green
    }
    else {
        Write-Host "Erro na transferência." -ForegroundColor Red
    }
}
catch {
    Write-Error "Falha no deploy: $_"
}

# 2. Reiniciar serviço (Sugestão)
# ssh "$User@$Ip" "sudo systemctl restart tirilo"

Write-Host "Deploy Concluído! (Apenas 1 autenticação necessária)" -ForegroundColor Green
