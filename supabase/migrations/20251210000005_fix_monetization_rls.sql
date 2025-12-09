-- Emergency RLS fix for monetization table
-- We will simplify the policy to just allow authenticated users for now, relying on app logic.
-- This is similar to the emergency fix for games table.

DROP POLICY IF EXISTS "Admins manage clinic games" ON saas_clinicas_jogos;
DROP POLICY IF EXISTS "Clinics view own games" ON saas_clinicas_jogos;

CREATE POLICY "Authenticated users manage monetization" ON saas_clinicas_jogos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE saas_clinicas_jogos ENABLE ROW LEVEL SECURITY;
