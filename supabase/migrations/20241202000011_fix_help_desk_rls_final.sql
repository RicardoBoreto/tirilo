-- Fix Help Desk RLS Policies (Final)

-- Drop existing policies
DROP POLICY IF EXISTS "Tickets Select Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Insert Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Update Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Mensagens Select Policy" ON help_desk_mensagens;
DROP POLICY IF EXISTS "Mensagens Insert Policy" ON help_desk_mensagens;

-- Helper function to get user clinic safely
-- Returns clinic_id if user is in a clinic, NULL if user is not in usuarios table (Master) or has no clinic
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS BIGINT AS $$
DECLARE
    v_clinic_id BIGINT;
BEGIN
    SELECT id_clinica INTO v_clinic_id
    FROM usuarios
    WHERE id = auth.uid();
    
    RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tickets Policies

-- SELECT: 
-- If get_user_clinic_id() is NULL, it means user is Master Admin (or not in clinic), so see ALL.
-- If get_user_clinic_id() returns a value, user sees only that clinic's tickets.
CREATE POLICY "Tickets Select Policy" ON help_desk_tickets
FOR SELECT
USING (
    get_user_clinic_id() IS NULL
    OR
    id_clinica = get_user_clinic_id()
);

-- INSERT: Anyone can create a ticket if they belong to a clinic
CREATE POLICY "Tickets Insert Policy" ON help_desk_tickets
FOR INSERT
WITH CHECK (
    id_clinica = get_user_clinic_id()
);

-- UPDATE: Master Admin or Clinic Owner
CREATE POLICY "Tickets Update Policy" ON help_desk_tickets
FOR UPDATE
USING (
    get_user_clinic_id() IS NULL
    OR
    id_clinica = get_user_clinic_id()
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
            get_user_clinic_id() IS NULL
            OR
            t.id_clinica = get_user_clinic_id()
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
            get_user_clinic_id() IS NULL
            OR
            t.id_clinica = get_user_clinic_id()
        )
    )
);
