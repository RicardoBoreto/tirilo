-- 1. Tabela de Operadoras de Saúde (Convênios)
CREATE TABLE IF NOT EXISTS public.saas_operadoras (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) NOT NULL,
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    registro_ans TEXT,
    prazo_pagamento_dias INTEGER DEFAULT 30,
    -- Campos Adicionais para Faturamento/NF
    endereco_logradouro TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    endereco_cep TEXT,
    telefone TEXT,
    contato_nome TEXT,
    contato_cargo TEXT,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vincular Operadora ao Paciente
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS operadora_id INTEGER REFERENCES public.saas_operadoras(id);
