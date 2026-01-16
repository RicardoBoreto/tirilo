CREATE TABLE IF NOT EXISTS public.saas_empresa (
    id SERIAL PRIMARY KEY,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    
    -- Endereço Estruturado
    end_logradouro TEXT,
    end_numero TEXT,
    end_complemento TEXT,
    end_bairro TEXT,
    end_cidade TEXT,
    end_estado TEXT,
    end_cep TEXT,

    telefone TEXT,
    email_contato TEXT,
    site_url TEXT,
    logo_url TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Segurança (RLS)
ALTER TABLE public.saas_empresa ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários autenticados (necessário para gerar faturas/relatórios)
CREATE POLICY "Leitura permitida para autenticados" ON public.saas_empresa
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir escrita apenas para Super Administradores
-- Assumindo que a lógica de Super Admin é tratada por não ter id_clinica ou verificação específica.
-- Por enquanto, restringiremos aos autenticados, mas idealmente isso precisa de controle mais rigoroso.
CREATE POLICY "Escrita permitida apenas para Super Admin" ON public.saas_empresa
    FOR ALL
    TO authenticated
    USING (
         (SELECT count(*) FROM public.usuarios WHERE id = auth.uid()) = 0 
         OR
         auth.uid() IN (SELECT id FROM public.usuarios WHERE tipo_perfil = 'master_admin')
    );

DROP POLICY IF EXISTS "Escrita permitida apenas para Super Admin" ON public.saas_empresa;
