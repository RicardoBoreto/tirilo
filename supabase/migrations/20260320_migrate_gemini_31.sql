-- ============================================================================
-- TIRILO SAAS - MIGRATION: CONFIGURAÇÃO DINÂMICA & GEMINI 3.1
-- Data: 20/03/2026
-- ============================================================================

-- 1. Tabela de Configuração Global
CREATE TABLE IF NOT EXISTS public.saas_config_global (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir/Atualizar o modelo Gemini padrão
INSERT INTO public.saas_config_global (key, value)
VALUES ('gemini_model_default', '"gemini-3.1-flash-lite-preview"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Tabela de Planos de Intervenção: Adicionar coluna para Thought Signatures
ALTER TABLE public.planos_intervencao_ia
ADD COLUMN IF NOT EXISTS last_thought_signature TEXT;

COMMENT ON COLUMN public.planos_intervencao_ia.last_thought_signature 
IS 'Armazena a assinatura de pensamento da última resposta da IA para continuidade do raciocínio (Gemini 3.1+).';

-- 3. Atualizar modelos em prompts_ia
-- Atualiza o valor default da coluna
ALTER TABLE public.prompts_ia
ALTER COLUMN modelo_gemini SET DEFAULT 'gemini-3.1-flash-lite-preview';

-- Atualiza registros existentes que usam versões antigas
UPDATE public.prompts_ia
SET modelo_gemini = 'gemini-3.1-flash-lite-preview'
WHERE modelo_gemini LIKE 'gemini-1.%' 
   OR modelo_gemini LIKE 'gemini-2.%'
   OR modelo_gemini = 'gemini-pro';

-- 4. Permissões de Leitura para a Tabela Global
ALTER TABLE public.saas_config_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública para configurações globais" ON public.saas_config_global;
CREATE POLICY "Leitura pública para configurações globais" ON public.saas_config_global
FOR SELECT USING (true);

-- Apenas Super Admin (sem id_clinica) pode gerenciar (mesma lógica das diretrizes)
DROP POLICY IF EXISTS "Gerenciamento apenas por Super Admin" ON public.saas_config_global;
CREATE POLICY "Gerenciamento apenas por Super Admin" ON public.saas_config_global
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios WHERE id = auth.uid() AND id_clinica IS NULL
  )
);
