-- Ensure RLS is enabled
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- PACIENTES POLICIES
DROP POLICY IF EXISTS "Pacientes Policy Select" ON pacientes;
CREATE POLICY "Pacientes Policy Select" ON pacientes
FOR SELECT
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    -- Admin/Owner/Secretaria sees all patients in clinic
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    -- Therapist sees only linked patients
    EXISTS (
      SELECT 1 FROM pacientes_terapeutas 
      WHERE paciente_id = pacientes.id 
      AND terapeuta_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Pacientes Policy Insert" ON pacientes;
CREATE POLICY "Pacientes Policy Insert" ON pacientes
FOR INSERT
WITH CHECK (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  -- Any authenticated user in the clinic can create a patient? Usually yes, or restricted to admin.
  -- Let's allow all for simplicity as requested, provided they are in the clinic.
);

DROP POLICY IF EXISTS "Pacientes Policy Update" ON pacientes;
CREATE POLICY "Pacientes Policy Update" ON pacientes
FOR UPDATE
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    EXISTS (
      SELECT 1 FROM pacientes_terapeutas 
      WHERE paciente_id = pacientes.id 
      AND terapeuta_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Pacientes Policy Delete" ON pacientes;
CREATE POLICY "Pacientes Policy Delete" ON pacientes
FOR DELETE
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    -- Only admins can delete patients? Or therapists too?
    -- Let's restrict delete to non-therapists (Admins) for safety, or allow if linked.
    -- "Lightweight" implies trusting the app, but let's stick to Admin only for delete to be safe.
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
  )
);

-- AGENDAMENTOS POLICIES
DROP POLICY IF EXISTS "Agendamentos Policy Select" ON agendamentos;
CREATE POLICY "Agendamentos Policy Select" ON agendamentos
FOR SELECT
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    -- Admin sees all
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    -- Therapist sees own appointments
    id_terapeuta = auth.uid()
  )
);

DROP POLICY IF EXISTS "Agendamentos Policy Insert" ON agendamentos;
CREATE POLICY "Agendamentos Policy Insert" ON agendamentos
FOR INSERT
WITH CHECK (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    id_terapeuta = auth.uid()
  )
);

DROP POLICY IF EXISTS "Agendamentos Policy Update" ON agendamentos;
CREATE POLICY "Agendamentos Policy Update" ON agendamentos
FOR UPDATE
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    id_terapeuta = auth.uid()
  )
);

DROP POLICY IF EXISTS "Agendamentos Policy Delete" ON agendamentos;
CREATE POLICY "Agendamentos Policy Delete" ON agendamentos
FOR DELETE
USING (
  id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
  AND (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil != 'terapeuta')
    OR
    id_terapeuta = auth.uid()
  )
);
