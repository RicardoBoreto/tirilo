-- Relaxing RLS Policy for SELECT to allow therapists to see all clinic prompts (including those from admins) for cloning purposes
-- They still can't EDIT them (handled by UPDATE policy), but they can SELECT them.

DROP POLICY IF EXISTS "Prompts Policy Select" ON prompts_ia;

CREATE POLICY "Prompts Policy Select" ON prompts_ia
FOR SELECT
USING (
  id_clinica IN (
    SELECT id_clinica FROM usuarios WHERE id = auth.uid()
  )
  -- Allow seeing ALL prompts from the same clinic, regardless of who created them.
  -- The visibility logic (active/inactive, specific filtering) can be handled by the application query if needed,
  -- but primarily RLS should just ensure tenant isolation (clinic).
);
