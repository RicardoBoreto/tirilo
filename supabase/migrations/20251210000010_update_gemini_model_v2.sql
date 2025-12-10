-- Atualiza todos os prompts que usavam o modelo antigo
UPDATE prompts_ia
SET modelo_gemini = 'gemini-2.5-flash'
WHERE modelo_gemini = 'gemini-1.5-flash' OR modelo_gemini = 'gemini-1.0-pro';

-- Atualiza o valor default da coluna (se houver constraints)
ALTER TABLE prompts_ia
ALTER COLUMN modelo_gemini SET DEFAULT 'gemini-2.5-flash';
