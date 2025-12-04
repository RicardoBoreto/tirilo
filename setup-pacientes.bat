@echo off
echo ========================================
echo   SETUP DO MODULO DE PACIENTES
echo ========================================
echo.
echo Este script vai ajudar voce a configurar o modulo de pacientes.
echo.
echo PASSO 1: Execute o SQL no Supabase
echo -----------------------------------------
echo 1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
echo 2. Copie todo o conteudo do arquivo: supabase-pacientes-setup.sql
echo 3. Cole no SQL Editor e clique em RUN
echo.
pause
echo.
echo PASSO 2: Gerando tipos TypeScript...
echo -----------------------------------------
npx supabase gen types typescript --project-id kragnthopsuwejezvixw > types/database.types.ts
echo.
echo ✓ Tipos gerados com sucesso!
echo.
echo PASSO 3: Iniciando servidor...
echo -----------------------------------------
npm run dev
