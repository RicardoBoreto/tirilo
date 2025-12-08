-- Migration: Fix Financeiro Schema and RLS for Therapists
-- Data: 08/12/2025

-- 1. Adicionar campo id_terapeuta na tabela contratos (faltava na criação original)
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS id_terapeuta UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_terapeuta ON contratos(id_terapeuta);

-- 2. Atualizar permissões RLS para CONTRATOS
DROP POLICY IF EXISTS "Access to contracts" ON contratos;

CREATE POLICY "Access to contracts" ON contratos
FOR ALL USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
    AND (
        -- Admins e Financeiro veem tudo
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil IN ('admin', 'financeiro', 'super_admin'))
        OR 
        -- Terapeutas veem seus próprios contratos OU se a política da clínica permitir (por enquanto, liberado na clínica mas vamos filtrar na UI)
        -- Mas para garantir que o insert funcione, o terapeuta precisa ter permissão.
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil = 'terapeuta')
    )
);

-- 3. Atualizar permissões RLS para FINANCEIRO_LANCAMENTOS
DROP POLICY IF EXISTS "Access to financial records" ON financeiro_lancamentos;

CREATE POLICY "Access to financial records" ON financeiro_lancamentos
FOR ALL USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil IN ('admin', 'financeiro', 'super_admin'))
        OR
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil = 'terapeuta')
    )
);

-- 4. Atualizar permissões RLS para FINANCEIRO_CATEGORIAS (se necessário)
-- A política original já era por clínica, sem restrição de perfil, então OK.
