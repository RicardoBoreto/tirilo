-- Simplificação FINAL das políticas RLS
-- Objetivo: Garantir APENAS que dados não vazem entre clínicas.
-- Filtros de visualização (ex: terapeuta ver apenas seus pacientes) ficam a cargo da aplicação.

-- 1. Reativar RLS (caso esteja desativado)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_terapeutas ENABLE ROW LEVEL SECURITY;

-- 2. Garantir que a função helper exista e seja segura
-- Esta função é CRUCIAL para evitar o loop infinito ("infinite recursion")
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER -- Roda com permissões do criador (postgres), ignorando RLS
SET search_path = public
STABLE
AS $$
    SELECT id_clinica FROM usuarios WHERE id = auth.uid();
$$;

-- 3. Políticas para USUARIOS (Ver apenas da mesma clínica)
DROP POLICY IF EXISTS "Users can view users from their clinic" ON usuarios;
CREATE POLICY "Users can view users from their clinic" ON usuarios
FOR SELECT USING (
    id = auth.uid() -- Vê a si mesmo
    OR 
    id_clinica = get_current_user_clinic_id() -- Vê outros da mesma clínica
);

-- 4. Políticas para PACIENTES (Ver apenas da mesma clínica)
DROP POLICY IF EXISTS "Users can view pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can view pacientes from their clinic" ON pacientes
FOR SELECT USING (
    id_clinica = get_current_user_clinic_id()
);

-- Políticas de escrita para Pacientes (Manter consistência)
DROP POLICY IF EXISTS "Users can insert pacientes for their clinic" ON pacientes;
CREATE POLICY "Users can insert pacientes for their clinic" ON pacientes
FOR INSERT WITH CHECK (
    id_clinica = get_current_user_clinic_id()
);

DROP POLICY IF EXISTS "Users can update pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can update pacientes from their clinic" ON pacientes
FOR UPDATE USING (
    id_clinica = get_current_user_clinic_id()
);

DROP POLICY IF EXISTS "Users can delete pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can delete pacientes from their clinic" ON pacientes
FOR DELETE USING (
    id_clinica = get_current_user_clinic_id()
);

-- 5. Políticas para PACIENTES_TERAPEUTAS
-- Permite ver qualquer vínculo se o paciente for da sua clínica
-- O filtro "ver apenas meus vínculos" será feito no backend (Code Level)
DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;
CREATE POLICY "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas
FOR SELECT USING (
    paciente_id IN (
        SELECT id FROM pacientes WHERE id_clinica = get_current_user_clinic_id()
    )
);
