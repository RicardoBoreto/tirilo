-- Add new columns to terapeutas_curriculo for AI personalization
ALTER TABLE terapeutas_curriculo 
ADD COLUMN IF NOT EXISTS tecnicas_preferidas text,
ADD COLUMN IF NOT EXISTS recursos_preferidos text,
ADD COLUMN IF NOT EXISTS estilo_conducao text,
ADD COLUMN IF NOT EXISTS observacoes_clinicas text;
