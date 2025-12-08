-- Atualiza todos os prompts para usar o modelo funcional gemini-2.5-flash
UPDATE prompts_ia
SET modelo_gemini = 'gemini-2.5-flash'
WHERE modelo_gemini IS NULL OR modelo_gemini = 'gemini-1.5-flash';
