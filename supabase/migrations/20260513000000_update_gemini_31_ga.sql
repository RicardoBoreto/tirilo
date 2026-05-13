-- Migração: atualiza modelo Gemini 3.1 Flash Lite de preview para GA
-- Google descontinua 'gemini-3.1-flash-lite-preview' em 25/05/2026

-- 1. Atualiza configuração global de modelo padrão
UPDATE saas_config_global
SET valor = '"gemini-3.1-flash-lite"'
WHERE chave = 'gemini_model_default'
  AND valor = '"gemini-3.1-flash-lite-preview"';

-- 2. Atualiza prompts que tinham o modelo preview definido explicitamente
UPDATE prompts_ia
SET modelo_gemini = 'gemini-3.1-flash-lite'
WHERE modelo_gemini = 'gemini-3.1-flash-lite-preview';
