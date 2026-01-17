ALTER TABLE planos_intervencao_ia ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE planos_intervencao_ia ADD COLUMN IF NOT EXISTS modelo_ia TEXT;

-- Atualiza planos antigos sem modelo para 'IA Genérica' (opcional)
-- UPDATE planos_intervencao_ia SET modelo_ia = 'IA' WHERE modelo_ia IS NULL;
