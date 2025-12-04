-- Add precisa_trocar_senha column to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN DEFAULT FALSE;

-- Update existing users (optional, maybe set to false for now)
UPDATE usuarios SET precisa_trocar_senha = FALSE WHERE precisa_trocar_senha IS NULL;
