-- ============================================================================
-- FIX: Adicionar coluna 'categoria' na tabela prompts_ia
-- Descrição: Este script corrige o erro "Could not find the 'categoria' column"
-- ============================================================================

-- 1. Adicionar a coluna se ela não existir
ALTER TABLE prompts_ia 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'plano';

-- 2. Atualizar todos os prompts existentes que estejam com categoria NULL para 'plano'
UPDATE prompts_ia 
SET categoria = 'plano' 
WHERE categoria IS NULL;

-- 3. (Opcional) Forçar recarregamento do schema do PostgREST
-- Isso geralmente acontece automaticamente, mas ajuda a garantir
NOTIFY pgrst, 'reload config';
