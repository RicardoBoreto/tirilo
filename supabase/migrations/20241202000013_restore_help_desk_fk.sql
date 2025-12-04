-- Restore Foreign Key constraints for Help Desk users (but allow NULL)
-- This fixes the Supabase relationship query error

-- 1. Ensure columns are nullable (they should be already, but just to be safe)
ALTER TABLE help_desk_tickets ALTER COLUMN id_usuario_criador DROP NOT NULL;
ALTER TABLE help_desk_mensagens ALTER COLUMN id_usuario DROP NOT NULL;

-- 2. Add FK back
-- We use ON DELETE SET NULL so if a user is deleted, their tickets remain (with null user)
ALTER TABLE help_desk_tickets 
    ADD CONSTRAINT help_desk_tickets_id_usuario_criador_fkey 
    FOREIGN KEY (id_usuario_criador) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL;

ALTER TABLE help_desk_mensagens 
    ADD CONSTRAINT help_desk_mensagens_id_usuario_fkey 
    FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL;
