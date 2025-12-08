-- Migration: Fix Prompts Unique Constraint
-- Data: 08/12/2025
-- Descrição: Altera a regra de unicidade para permitir nomes iguais para terapeutas diferentes na mesma clínica.

-- 1. Remove a constraint antiga (por clínica + nome)
ALTER TABLE prompts_ia DROP CONSTRAINT IF EXISTS prompts_ia_id_clinica_nome_prompt_key;

-- 2. Adiciona a nova constraint (clínica + terapeuta + nome)
-- Usamos 'terapeuta_id' pois foi o nome adicionado na migration 20241202000000
-- Caso o campo seja nulo (prompts globais da clínica?), a unique constraint padrão do SQL ignora NULLs (permite múltiplos), 
-- o que pode ser desejado ou não. Se prompts globais (admin) tiverem terapeuta_id NULL, ok.
-- Se todo prompt tem dono, então terapeuta_id é NOT NULL.

ALTER TABLE prompts_ia 
ADD CONSTRAINT prompts_ia_unique_owner_name UNIQUE (id_clinica, terapeuta_id, nome_prompt);
