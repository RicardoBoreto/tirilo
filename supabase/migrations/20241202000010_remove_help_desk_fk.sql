-- Remove Foreign Key constraints for Help Desk users
-- This allows Master Admins (who might not be in the 'usuarios' table) to create tickets and messages

-- Remove FK from help_desk_tickets
ALTER TABLE help_desk_tickets DROP CONSTRAINT IF EXISTS help_desk_tickets_id_usuario_criador_fkey;

-- Remove FK from help_desk_mensagens
ALTER TABLE help_desk_mensagens DROP CONSTRAINT IF EXISTS help_desk_mensagens_id_usuario_fkey;

-- Add a comment explaining why
COMMENT ON COLUMN help_desk_tickets.id_usuario_criador IS 'References auth.users(id). No FK constraint to allow Master Admins.';
COMMENT ON COLUMN help_desk_mensagens.id_usuario IS 'References auth.users(id). No FK constraint to allow Master Admins.';
