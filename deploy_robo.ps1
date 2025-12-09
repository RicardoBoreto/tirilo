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

# 0. Criar diretório (Removido para economizar senha - SCP falhará se pasta pai não existir)
# ssh "${User}@${Ip}" "mkdir -p ${RemotePath}/src"

# 1. Copiar Arquivos
Write-Host "-> Copiando arquivos..."
scp -r $LocalPath "${User}@${Ip}:${RemotePath}/src/"

# 2. Copiar Requirements (se houver root)
# 2. Copiar Requirements (Desativado para economizar senha, copie manualmente se mudar)
# if (Test-Path ".\robo_tirilo\requirements.txt") {
#    scp ".\robo_tirilo\requirements.txt" "${User}@${Ip}:${RemotePath}/"
# }

# 3. Reiniciar serviço (Opcional - requer sudo sem senha ou configuração prévia)
# ssh "$User@$Ip" "sudo systemctl restart tirilo"

Write-Host "Deploy Concluído!" -ForegroundColor Green
