
-- Correção FINAL de RLS para a Loja de Apps
-- Execute este script no SQL Editor do Supabase para garantir que a Loja funcinou.

-- 1. Tabela de Jogos (saas_jogos)
ALTER TABLE saas_jogos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Jogos - Leitura Geral" ON saas_jogos;
    -- Cria policy permissiva para leitura
    CREATE POLICY "Jogos - Leitura Geral" ON saas_jogos FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 2. Tabela de Habilidades (saas_habilidades)
ALTER TABLE saas_habilidades ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Habilidades - Leitura Geral" ON saas_habilidades;
    CREATE POLICY "Habilidades - Leitura Geral" ON saas_habilidades FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 3. Tabela de Vínculos (saas_jogos_habilidades)
ALTER TABLE saas_jogos_habilidades ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Vinculos - Leitura Geral" ON saas_jogos_habilidades;
    CREATE POLICY "Vinculos - Leitura Geral" ON saas_jogos_habilidades FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 4. Tabela de Licenças da Clínica (saas_clinicas_jogos)
ALTER TABLE saas_clinicas_jogos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Clinicas veem seus jogos" ON saas_clinicas_jogos;
    CREATE POLICY "Clinicas veem seus jogos" ON saas_clinicas_jogos FOR SELECT TO authenticated 
    USING (clinica_id IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid()));
    
    -- Permite inserir compra
    DROP POLICY IF EXISTS "Clinicas compram jogos" ON saas_clinicas_jogos;
    CREATE POLICY "Clinicas compram jogos" ON saas_clinicas_jogos FOR INSERT TO authenticated 
    WITH CHECK (clinica_id IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid()));

EXCEPTION WHEN OTHERS THEN NULL; END $$;
