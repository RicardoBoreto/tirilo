-- Fix RLS for terapeutas_curriculo to allow admins and financeiro users to view all
-- Also allow financeiro/admin to update/insert? Yes, for the edit form.

DROP POLICY IF EXISTS "Therapists can view their own curriculum" ON terapeutas_curriculo;
DROP POLICY IF EXISTS "Therapists can update their own curriculum" ON terapeutas_curriculo;

-- Standardize policies

-- SELECT
CREATE POLICY "allow_read_curriculo" ON terapeutas_curriculo
FOR SELECT USING (
    id_usuario = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND tipo_perfil IN ('admin', 'financeiro')
    )
);

-- UPDATE
CREATE POLICY "allow_update_curriculo" ON terapeutas_curriculo
FOR UPDATE USING (
    id_usuario = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND tipo_perfil IN ('admin', 'financeiro')
    )
);

-- INSERT
CREATE POLICY "allow_insert_curriculo" ON terapeutas_curriculo
FOR INSERT WITH CHECK (
    id_usuario = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND tipo_perfil IN ('admin', 'financeiro')
    )
);
