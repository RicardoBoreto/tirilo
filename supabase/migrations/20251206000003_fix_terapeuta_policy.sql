-- Simplificar a política de visualização de vínculos terapeuta-paciente
-- Isso garante que o terapeuta possa ver seus próprios pacientes sem depender de subqueries complexas

DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;

CREATE POLICY "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas
FOR SELECT USING (
    -- O usuário vê se for o terapeuta do vínculo
    terapeuta_id = auth.uid() 
    OR 
    -- OU se o paciente for da mesma clínica (para admins e recepção)
    paciente_id IN (SELECT id FROM pacientes WHERE id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid()))
);
