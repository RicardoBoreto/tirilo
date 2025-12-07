-- Tentar corrigir a recursão garantindo que a função seja dona do postgres
-- e simplificando as políticas ao máximo

-- 1. Recriar funções auxiliares com permissões explícitas
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id_clinica FROM usuarios WHERE id = auth.uid();
$$;

-- Tentar alterar o dono para postgres (pode falhar se o usuário não for superuser, mas o Supabase SQL roda como admin)
ALTER FUNCTION get_current_user_clinic_id() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_current_user_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_clinic_id() TO service_role;


CREATE OR REPLACE FUNCTION is_admin_or_recepcao()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND tipo_perfil IN ('admin', 'recepcao')
    );
$$;

ALTER FUNCTION is_admin_or_recepcao() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_admin_or_recepcao() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_recepcao() TO service_role;


-- 2. Corrigir RLS de USUARIOS
DROP POLICY IF EXISTS "Users can view users from their clinic" ON usuarios;
-- Política simples: vê a si mesmo OU (se a função retornar true, vê o resto)
-- Para evitar loop na função is_admin, vamos usar a função APENAS para filtrar CLINICA
CREATE POLICY "Users can view users from their clinic" ON usuarios
FOR SELECT USING (
    id = auth.uid() 
    OR 
    id_clinica = get_current_user_clinic_id()
);


-- 3. Corrigir RLS de PACIENTES
DROP POLICY IF EXISTS "Users can view pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can view pacientes from their clinic" ON pacientes
FOR SELECT USING (
    id_clinica = get_current_user_clinic_id()
);


-- 4. Corrigir RLS de PACIENTES_TERAPEUTAS
DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;
CREATE POLICY "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas
FOR SELECT USING (
    -- Terapeuta vê seus próprios vínculos (acesso direto, sem subquery)
    terapeuta_id = auth.uid() 
    OR 
    -- Admins/Recepção veem todos da clínica (usando função segura)
    (
        is_admin_or_recepcao() 
        AND 
        paciente_id IN (
            SELECT id FROM pacientes WHERE id_clinica = get_current_user_clinic_id()
        )
    )
);
