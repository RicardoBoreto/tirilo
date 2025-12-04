-- Fix Help Desk RLS Policies (Direct Approach)

-- Drop existing policies
DROP POLICY IF EXISTS "Tickets Select Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Insert Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Update Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Mensagens Select Policy" ON help_desk_mensagens;
DROP POLICY IF EXISTS "Mensagens Insert Policy" ON help_desk_mensagens;

-- Drop the function just in case
DROP FUNCTION IF EXISTS get_user_clinic_id;

-- Tickets Policies

-- SELECT: 
-- Check if user exists in 'usuarios' table.
-- If NOT EXISTS -> Master Admin (See ALL)
-- If EXISTS -> See only matching clinic_id
CREATE POLICY "Tickets Select Policy" ON help_desk_tickets
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid())
    OR
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- INSERT: 
-- Only users belonging to a clinic can create tickets
CREATE POLICY "Tickets Insert Policy" ON help_desk_tickets
FOR INSERT
WITH CHECK (
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- UPDATE: 
-- Master Admin (not in usuarios) OR Clinic Owner (matching clinic)
CREATE POLICY "Tickets Update Policy" ON help_desk_tickets
FOR UPDATE
USING (
    NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid())
    OR
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- Mensagens Policies

-- SELECT:
CREATE POLICY "Mensagens Select Policy" ON help_desk_mensagens
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM help_desk_tickets t
        WHERE t.id = help_desk_mensagens.id_ticket
        AND (
            NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid())
            OR
            t.id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
        )
    )
);

-- INSERT:
CREATE POLICY "Mensagens Insert Policy" ON help_desk_mensagens
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM help_desk_tickets t
        WHERE t.id = help_desk_mensagens.id_ticket
        AND (
            NOT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid())
            OR
            t.id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
        )
    )
);
