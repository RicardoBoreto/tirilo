-- Add apelido (nickname) field to usuarios table
-- This allows for a shorter, friendly name to display in the UI

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS apelido TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN usuarios.apelido IS 'Nome curto/apelido para exibição no sistema (ex: "Dr. João", "Mari")';
