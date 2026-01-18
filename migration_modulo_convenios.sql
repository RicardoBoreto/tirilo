-- 1. Tabela de Operadoras de Saúde (Convênios)
CREATE TABLE IF NOT EXISTS public.saas_operadoras (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) NOT NULL,
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    registro_ans TEXT,
    prazo_pagamento_dias INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vincular Operadora ao Paciente
-- Mantemos carteirinha e validade no paciente, pois são específicos dele.
-- Adicionamos FK para a operadora.
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS operadora_id INTEGER REFERENCES public.saas_operadoras(id);

-- Opcional: Remover coluna antiga de texto se quiser limpar, ou manter como legado.
-- ALTER TABLE public.pacientes DROP COLUMN IF EXISTS convenio_nome;
