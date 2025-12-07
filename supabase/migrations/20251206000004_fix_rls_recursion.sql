-- Função auxiliar para obter o ID da clínica do usuário atual sem disparar RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id_clinica FROM usuarios WHERE id = auth.uid();
$$;

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND tipo_perfil = 'admin'
    );
$$;

-- 1. Corrigir RLS de USUARIOS (quebra o loop principal)
DROP POLICY IF EXISTS "Users can view users from their clinic" ON usuarios;
CREATE POLICY "Users can view users from their clinic" ON usuarios
FOR SELECT USING (
    id_clinica = get_current_user_clinic_id()
    OR id = auth.uid() -- O usuário sempre pode ver a si mesmo
);

-- 2. Corrigir RLS de PACIENTES (otimização)
DROP POLICY IF EXISTS "Users can view pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can view pacientes from their clinic" ON pacientes
FOR SELECT USING (
    id_clinica = get_current_user_clinic_id()
);

-- 3. Corrigir RLS de PACIENTES_TERAPEUTAS (quebra o loop de referência cruzada)
DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;
CREATE POLICY "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas
FOR SELECT USING (
    -- Terapeuta vê seus próprios vínculos
    terapeuta_id = auth.uid() 
    OR 
    -- Se o paciente pertence à mesma clínica do usuário (agora usando a função segura)
    paciente_id IN (
        SELECT id FROM pacientes WHERE id_clinica = get_current_user_clinic_id()
    )
);
