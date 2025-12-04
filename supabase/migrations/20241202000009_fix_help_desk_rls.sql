-- Fix Help Desk RLS Policies

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Tickets Select Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Insert Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Tickets Update Policy" ON help_desk_tickets;
DROP POLICY IF EXISTS "Mensagens Select Policy" ON help_desk_mensagens;
DROP POLICY IF EXISTS "Mensagens Insert Policy" ON help_desk_mensagens;

-- Tickets Policies

-- SELECT: Admin Master sees all, Clinic Users see their own clinic's tickets
CREATE POLICY "Tickets Select Policy" ON help_desk_tickets
FOR SELECT
USING (
    (SELECT id_clinica FROM usuarios WHERE id = auth.uid()) IS NULL
    OR
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- INSERT: Anyone can create a ticket (if they belong to a clinic)
CREATE POLICY "Tickets Insert Policy" ON help_desk_tickets
FOR INSERT
WITH CHECK (
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- UPDATE: Admin Master can update any, Clinic Users can update their own
CREATE POLICY "Tickets Update Policy" ON help_desk_tickets
FOR UPDATE
USING (
    (SELECT id_clinica FROM usuarios WHERE id = auth.uid()) IS NULL
    OR
    id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- Mensagens Policies

-- SELECT: Admin Master sees all messages, Clinic Users see messages from their clinic's tickets
CREATE POLICY "Mensagens Select Policy" ON help_desk_mensagens
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM help_desk_tickets t
        WHERE t.id = help_desk_mensagens.id_ticket
        AND (
            (SELECT id_clinica FROM usuarios WHERE id = auth.uid()) IS NULL
            OR
            t.id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
        )
    )
);

-- INSERT: Admin Master can reply to ANY ticket. Clinic Users can reply to their OWN tickets.
CREATE POLICY "Mensagens Insert Policy" ON help_desk_mensagens
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM help_desk_tickets t
        WHERE t.id = help_desk_mensagens.id_ticket
        AND (
            -- Admin Master (id_clinica IS NULL) can reply to ANY ticket
            (SELECT id_clinica FROM usuarios WHERE id = auth.uid()) IS NULL
            OR
            -- Clinic User can reply only if ticket belongs to their clinic
            t.id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
        )
    )
);
