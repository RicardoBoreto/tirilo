-- ============================================================================
-- TIRILO SAAS - MIGRATION: PERFIS DE PERSONALIDADE DO ROBÔ
-- Data: 29/03/2026
-- ============================================================================

-- 1. Tabela de Perfis de Personalidade
CREATE TABLE IF NOT EXISTS public.saas_perfis_robo (
    id               SERIAL PRIMARY KEY,
    clinica_id       INTEGER REFERENCES public.saas_clinicas(id),
    nome             TEXT NOT NULL,
    descricao        TEXT,
    prompt_instrucao TEXT NOT NULL,
    modo_base        TEXT NOT NULL DEFAULT 'CRIANCA'
                         CHECK (modo_base IN ('CRIANCA', 'TERAPEUTA')),
    ativo            BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coluna de perfil ativo no robô
ALTER TABLE public.saas_frota_robos
    ADD COLUMN IF NOT EXISTS perfil_ativo_id INTEGER
        REFERENCES public.saas_perfis_robo(id);

-- 3. RLS
ALTER TABLE public.saas_perfis_robo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis leitura anon"
    ON public.saas_perfis_robo FOR SELECT USING (true);

CREATE POLICY "Perfis gestao autenticados"
    ON public.saas_perfis_robo FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
