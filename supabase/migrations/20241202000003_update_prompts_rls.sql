-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Prompts visíveis por clínica" ON prompts_ia;
DROP POLICY IF EXISTS "Prompts criáveis por usuários da clínica" ON prompts_ia;
DROP POLICY IF EXISTS "Prompts editáveis por usuários da clínica" ON prompts_ia;
DROP POLICY IF EXISTS "Prompts deletáveis por usuários da clínica" ON prompts_ia;

-- Enable RLS
ALTER TABLE prompts_ia ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can see prompts from their clinic
-- AND (if they are a therapist, they only see their own OR if they are admin/owner, they see all)
-- Ideally, we simplify: Users can see prompts where id_clinica matches their clinic.
-- The filtering logic (therapist only seeing theirs) is handled in the application layer for UX,
-- but for security, we can be more strict if needed.
-- For now, let's allow viewing all prompts in the same clinic to avoid complexity, 
-- or strictly enforce the rule requested:
-- "Terapeuta comum: vê apenas seus próprios prompts"
-- "Administrador: vê todos os prompts da clínica"

CREATE POLICY "Prompts Policy Select" ON prompts_ia
FOR SELECT
USING (
  id_clinica IN (
    SELECT id_clinica FROM usuarios WHERE id = auth.uid()
  )
  AND (
    -- If user is the owner of the prompt
    terapeuta_id = auth.uid()
    OR
    -- OR if user is NOT a therapist (meaning they are admin/owner/secretaria)
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND tipo_perfil != 'terapeuta'
    )
  )
);

-- Policy for INSERT: Users can create prompts for their clinic
CREATE POLICY "Prompts Policy Insert" ON prompts_ia
FOR INSERT
WITH CHECK (
  id_clinica IN (
    SELECT id_clinica FROM usuarios WHERE id = auth.uid()
  )
  AND (
    -- If creating for themselves
    terapeuta_id = auth.uid()
    OR
    -- OR if user is admin, they can create for others
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND tipo_perfil != 'terapeuta'
    )
  )
);

-- Policy for UPDATE: 
CREATE POLICY "Prompts Policy Update" ON prompts_ia
FOR UPDATE
USING (
  id_clinica IN (
    SELECT id_clinica FROM usuarios WHERE id = auth.uid()
  )
  AND (
    terapeuta_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND tipo_perfil != 'terapeuta'
    )
  )
);

-- Policy for DELETE:
CREATE POLICY "Prompts Policy Delete" ON prompts_ia
FOR DELETE
USING (
  id_clinica IN (
    SELECT id_clinica FROM usuarios WHERE id = auth.uid()
  )
  AND (
    terapeuta_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND tipo_perfil != 'terapeuta'
    )
  )
);
