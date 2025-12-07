-- SCRIPT DE LIMPEZA DINÂMICA E CORREÇÃO DEFINITIVA
-- Este script varre o catálogo do banco (pg_policies) e remove TODAS as políticas
-- das tabelas conflitantes, depois recria apenas o necessário.

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- 1. Loop para remover TODAS as políticas de 'usuarios'
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'usuarios') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON usuarios'; 
    END LOOP;

    -- 2. Loop para remover TODAS as políticas de 'pacientes'
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pacientes') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON pacientes'; 
    END LOOP;

    -- 3. Loop para remover TODAS as políticas de 'pacientes_terapeutas'
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pacientes_terapeutas') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON pacientes_terapeutas'; 
    END LOOP;
END $$;

-- Agora que limpamos tudo, vamos recriar do zero.

-- ============================================================================
-- 1. USUARIOS (Acesso de leitura total para autenticados - Quebra a recursão)
-- ============================================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_authenticated" ON usuarios
FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_update_own_profile" ON usuarios
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "allow_insert_admin" ON usuarios
FOR INSERT WITH CHECK (
    -- Admin pode criar usuários para sua clínica (lógica simplificada para evitar subquery complexa aqui se possível)
    -- Mas como leitura está liberada, podemos fazer subquery segura.
    EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.id = auth.uid() 
        AND u.tipo_perfil = 'admin' 
        AND u.id_clinica = usuarios.id_clinica
    )
);

-- ============================================================================
-- 2. FUNÇÃO HELPER (Garante consistência na busca de clínica)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id_clinica FROM usuarios WHERE id = auth.uid();
$$;

-- ============================================================================
-- 3. PACIENTES (Isolamento por Clínica)
-- ============================================================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isolate_by_clinic_select" ON pacientes
FOR SELECT USING (
    id_clinica = get_my_clinic_id()
);

CREATE POLICY "isolate_by_clinic_insert" ON pacientes
FOR INSERT WITH CHECK (
    id_clinica = get_my_clinic_id()
);

CREATE POLICY "isolate_by_clinic_update" ON pacientes
FOR UPDATE USING (
    id_clinica = get_my_clinic_id()
);

CREATE POLICY "isolate_by_clinic_delete" ON pacientes
FOR DELETE USING (
    id_clinica = get_my_clinic_id()
);

-- ============================================================================
-- 4. PACIENTES_TERAPEUTAS (Isolamento por Clínica - Herança)
-- ============================================================================
ALTER TABLE pacientes_terapeutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isolate_relationships_select" ON pacientes_terapeutas
FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes)
);

CREATE POLICY "isolate_relationships_insert" ON pacientes_terapeutas
FOR INSERT WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes)
);

CREATE POLICY "isolate_relationships_delete" ON pacientes_terapeutas
FOR DELETE USING (
    paciente_id IN (SELECT id FROM pacientes)
);
