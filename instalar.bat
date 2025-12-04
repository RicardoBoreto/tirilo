@echo off
chcp 65001 >nul
echo ========================================
echo   SaaS Tirilo - Instalação Automática
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo 1. Acesse: https://nodejs.org/
    echo 2. Baixe a versão LTS
    echo 3. Execute o instalador
    echo 4. Reinicie o terminal
    echo 5. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado!
node --version
echo.

REM Verificar se npm está disponível
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

echo ✅ npm encontrado!
npm --version
echo.

REM Instalar dependências
echo 📦 Instalando dependências...
echo Isso pode levar alguns minutos...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Instalação concluída com sucesso!
echo ========================================
echo.
echo Próximos passos:
echo.
echo 1. Configure o banco de dados:
echo    - Acesse https://supabase.com/dashboard
echo    - Execute o arquivo supabase-setup.sql
echo.
echo 2. Inicie o servidor de desenvolvimento:
echo    npm run dev
echo.
echo 3. Acesse: http://localhost:3000
echo.
echo Leia o arquivo INSTALACAO.md para mais detalhes.
echo.
pause
