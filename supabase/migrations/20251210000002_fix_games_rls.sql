-- CORREÇÃO DE PERMISSÕES (RLS)
-- Siga a ordem de execução abaixo para corrigir o erro.

-- 1. Limpar policies antigas para evitar conflitos
DROP POLICY IF EXISTS "Admin ve todos jogos" ON saas_jogos;
DROP POLICY IF EXISTS "Admin gerencia jogos" ON saas_jogos;
DROP POLICY IF EXISTS "Admin ve versoes" ON saas_jogos_versoes;
DROP POLICY IF EXISTS "Admin gerencia versoes" ON saas_jogos_versoes;

-- 2. Recriar Policies para Tabela de Jogos (saas_jogos)
-- Permite leitura para todos (para o robô e usuários verem)
CREATE POLICY "Jogos - Leitura Geral" ON saas_jogos
    FOR SELECT USING (true);

-- Permite gestão total apenas para admins verificado na tabela de usuarios
CREATE POLICY "Jogos - Gestao Admin" ON saas_jogos
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.tipo_perfil IN ('admin', 'super_admin')
        )
    );

-- 3. Recriar Policies para Histórico (saas_jogos_versoes)
CREATE POLICY "Versoes - Leitura Geral" ON saas_jogos_versoes
    FOR SELECT USING (true);

CREATE POLICY "Versoes - Gestao Admin" ON saas_jogos_versoes
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.tipo_perfil IN ('admin', 'super_admin')
        )
    );

-- 4. Permissões de Storage (Bucket 'fotos')
-- Tenta criar policy de upload para autenticados se não existir
-- Nota: O Postgres não tem "CREATE POLICY IF NOT EXISTS", então se der erro aqui,
-- provavelmente você já tem permissão. Ignore erros nesta etapa se forem de "policy already exists".

BEGIN;
  -- Upload
  CREATE POLICY "Fotos - Upload Auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
  -- Update
  CREATE POLICY "Fotos - Update Auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar erro se policy já existe
  RAISE NOTICE 'Policies de storage ja existem ou deram conflito, ignorando...';
END;

-- Select Publico já deve existir, mas reforçando
CREATE POLICY "Fotos - Select Publico" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
