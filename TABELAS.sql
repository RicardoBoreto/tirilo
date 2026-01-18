
-- ============================================================================
-- TIRILO SAAS - SCHEMA DE BANCO DE DADOS (V2.0)
-- Atualizado em: 10/12/2025
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SAAS & CLÍNICAS
-- ----------------------------------------------------------------------------

CREATE TABLE public.saas_empresa (
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

CREATE TABLE public.saas_clinicas (
    id SERIAL PRIMARY KEY,
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    email_contato TEXT,
    telefone TEXT,
    endereco JSONB, -- { "rua": "...", "numero": "...", ... } (Legado/Alternativo)
    
    -- Endereço Estruturado (Adicionado em 12/12/2025)
    end_logradouro TEXT,
    end_numero TEXT,
    end_complemento TEXT,
    end_bairro TEXT,
    end_cidade TEXT,
    end_estado TEXT,
    end_cep TEXT,

    logo_url TEXT,
    
    -- Dados Adicionais (Adicionado em 12/12/2025)
    inscricao_estadual TEXT,
    missao TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE,

    -- Configurações e Customizações
    configuracoes JSONB DEFAULT '{}'::jsonb -- { "cor_primaria": "#...", ... }
);

CREATE TABLE public.clinicas_salas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.saas_operadoras (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    registro_ans TEXT,
    
    -- Endereço e Contato (Adicionado 1.10.0)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. USUÁRIOS & PERMISSÕES
-- ----------------------------------------------------------------------------

CREATE TYPE tipo_usuario_enum AS ENUM ('superadmin', 'gestor', 'terapeuta', 'recepcionista');

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id), -- Null se superadmin
    tipo_usuario tipo_usuario_enum NOT NULL,
    
    -- Dados Terapeuta
    registro_profissional TEXT, -- CRP/CRM
    especialidade TEXT,
    bio TEXT,
    foto_url TEXT,
    celular_whatsapp TEXT,

    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PACIENTES & FAMÍLIA
-- ----------------------------------------------------------------------------

CREATE TABLE public.pacientes (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) NOT NULL,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    genero TEXT,
    nome_responsavel TEXT, -- Legado/Simples
    contato_responsavel TEXT, -- Legado/Simples
    foto_url TEXT,
    endereco TEXT,
    operadora_id INTEGER REFERENCES public.saas_operadoras(id), -- Adicionado 1.10.0
    carteirinha_planodesaude TEXT,
    validade_planodesaude DATE, -- Adicionado 1.10.0
    status TEXT DEFAULT 'ATIVO', -- ATIVO, INATIVO, ALTA
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pacientes_anamnese (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    
    -- Dados Clínicos
    queixa_principal TEXT,
    historico_medico TEXT,
    medicamentos_atuais TEXT,
    alergias TEXT,
    
    -- Desenvolvimento
    gestacao_intercorrencias TEXT,
    parto_tipo TEXT,
    desenvolvimento_motor TEXT,
    desenvolvimento_linguagem TEXT,
    
    -- Musicoterapia (Específico)
    musicoterapia JSONB DEFAULT '{}'::jsonb, -- { "preferencias_musicais": [...], "reacao_sons": "..." }

    laudo_medico_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pacientes_terapeutas (
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    terapeuta_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (paciente_id, terapeuta_id)
);

CREATE TABLE public.responsaveis (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Link para login (Portal da Família)
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    telefone TEXT,
    email TEXT
);

CREATE TABLE public.pacientes_responsaveis (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    responsavel_id INTEGER REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    tipo_vinculo TEXT -- Pai, Mãe, Avô, etc.
);

-- ----------------------------------------------------------------------------
-- 4. AGENDAMENTO & FINANCEIRO
-- ----------------------------------------------------------------------------

CREATE TYPE status_agendamento_enum AS ENUM ('AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTA');

CREATE TABLE public.agendamentos (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_sala INTEGER REFERENCES public.clinicas_salas(id), -- Opcional
    
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    
    tipo_sessao TEXT, -- Terapia, Avaliação, Ludoterapia, Histórico
    status status_agendamento_enum DEFAULT 'AGENDADO',
    observacoes TEXT,
    
    valor_sessao NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.financeiro_lancamentos (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    tipo TEXT CHECK (tipo IN ('RECEITA', 'DESPESA')),
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO
    categoria TEXT,
    
    forma_pagamento TEXT, -- Adicionado 1.10.0
    comprovante_url TEXT, -- Adicionado 1.10.0
    
    -- Vínculos
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_agendamento INTEGER REFERENCES public.agendamentos(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ROBÔS & LUDOTERAPIA (MÓDULO NOVO)
-- ----------------------------------------------------------------------------

-- Catálogo de Habilidades (Loja)
CREATE TABLE public.saas_habilidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE, -- Ex: "Foco", "Memória", "Interação Social"
    descricao TEXT,
    codigo_ia TEXT -- Prompt base ou tag para IA
);

-- Catálogo de Jogos (Global)
CREATE TABLE public.saas_jogos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT, -- "EDUCATIVO", "MOTOR", "SOCIAL"
    comando_entrada TEXT, -- Comando para iniciar no robô (ex: "start_memoria")
    
    imagem_url TEXT,
    preco NUMERIC(10,2) DEFAULT 0.00, -- 0 = Gratuito
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relacionamento Jogo <-> Habilidades (N:N)
CREATE TABLE public.saas_jogos_habilidades (
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    habilidade_id UUID REFERENCES public.saas_habilidades(id) ON DELETE CASCADE,
    nivel_impacto INTEGER DEFAULT 1, -- 1 a 5
    PRIMARY KEY (jogo_id, habilidade_id)
);

-- Controle de Versões (OTA)
CREATE TABLE public.saas_jogos_versoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    versao TEXT NOT NULL, -- "1.0.0"
    arquivo_url TEXT NOT NULL, -- URL do .zip ou .py no Storage
    changelog TEXT,
    obrigatorio BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aquisições da Clínica
CREATE TABLE public.saas_clinicas_jogos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) ON DELETE CASCADE,
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    
    ativo BOOLEAN DEFAULT TRUE, -- Se a clínica ativou/desativou
    data_aquisicao TIMESTAMPTZ DEFAULT NOW(),
    validade TIMESTAMPTZ, -- Null = perpétuo
    licenca_tipo TEXT DEFAULT 'PERPETUA', -- PERPETUA, MENSAL, TESTE
    
    UNIQUE(clinica_id, jogo_id)
);

-- Frota de Robôs
CREATE TABLE public.saas_frota_robos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) ON DELETE CASCADE,
    nome_robo TEXT NOT NULL, -- Ex: "Tirilo 01"
    modelo TEXT DEFAULT 'Raspberry Pi 4',
    numero_serie TEXT UNIQUE NOT NULL, -- Usado para identificar o robô na API
    
    status TEXT DEFAULT 'OFFLINE', -- ONLINE, OFFLINE, EM_SESSAO, MANUTENCAO
    bateria_nivel INTEGER,
    versao_software TEXT,
    
    -- Rede (Tailscale)
    endereco_tailscale TEXT, -- IP 100.x.y.z
    usuario_ssh TEXT, -- Default: 'pi'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);

-- Configuração de IA da Clínica (Personalidade)
CREATE TABLE public.saas_clinicas_config_ia (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) UNIQUE,
    tom_de_voz TEXT DEFAULT 'Empático e Lúdico',
    restricoes TEXT, -- O que NÃO fazer
    model_version TEXT DEFAULT 'gemini-2.5-flash'
);

-- ----------------------------------------------------------------------------
-- 6. SESSÕES LÚDICAS (HISTÓRICO)
-- ----------------------------------------------------------------------------

CREATE TABLE public.sessao_ludica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    paciente_id INTEGER REFERENCES public.pacientes(id),
    terapeuta_id UUID REFERENCES public.usuarios(id),
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    jogo_id UUID REFERENCES public.saas_jogos(id),
    
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    data_fim TIMESTAMPTZ,
    duracao_segundos INTEGER,
    
    status TEXT DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, CONCLUIDO, INTERROMPIDO
    
    pontuacao_final INTEGER,
    nivel_dificuldade TEXT, -- FACIL, MEDIO, DIFICIL
    
    -- Métricas estruturadas
    metricas JSONB DEFAULT '{}'::jsonb, -- { "tempolatencia": 2.5, "acertos": 10 }
    
    observacoes_terapeuta TEXT
);

CREATE TABLE public.sessao_diario_bordo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sessao_ludica_id UUID REFERENCES public.sessao_ludica(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    tipo_evento TEXT, -- FALA_ROBO, FALA_PACIENTE, ACAO_JOGO, INTERVENCAO_TERAPEUTA
    texto_transcrito TEXT, -- O que foi falado (STT/TTS)
    metadados JSONB -- Emoção detectada, contexto, etc.
);

-- Telemetria Bruta (Logs técnicos)
CREATE TABLE public.telemetry (
    id SERIAL PRIMARY KEY,
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    cpu_usage NUMERIC,
    ram_usage NUMERIC,
    temp_cpu NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Comandos Remotos (Fila)
CREATE TABLE public.comandos_robo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    comando TEXT NOT NULL, -- Ex: "update_software", "restart"
    parametros JSONB,
    status TEXT DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 7. IA GENERATIVA & RELATÓRIOS (V1.7.5)
-- ----------------------------------------------------------------------------

CREATE TABLE public.prompts_ia (
    id SERIAL PRIMARY KEY,
    id_clinica INTEGER REFERENCES public.saas_clinicas(id),
    terapeuta_id UUID REFERENCES public.usuarios(id),
    nome_prompt TEXT NOT NULL,
    descricao TEXT,
    prompt_texto TEXT NOT NULL,
    modelo_gemini TEXT DEFAULT 'gemini-2.5-flash',
    temperatura NUMERIC DEFAULT 0.7,
    ativo BOOLEAN DEFAULT TRUE,
    categoria TEXT, -- 'avaliacao', 'plano', 'relatorio'
    criado_por TEXT, -- Nome do criador
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.planos_intervencao_ia (
    id SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_prompt_ia INTEGER REFERENCES public.prompts_ia(id), -- Pode ser NULL
    
    titulo TEXT, -- Título do plano (Adicionado V1.7.5)
    plano_final TEXT, -- Texto gerado/importado
    plano_original TEXT, -- Texto raw da IA
    modelo_ia TEXT, -- Versão do modelo usado
    historico_chat JSONB DEFAULT '[]'::jsonb, -- Histórico de conversa para refinamento
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.relatorios_atendimento (
    id SERIAL PRIMARY KEY,
    id_agendamento INTEGER REFERENCES public.agendamentos(id),
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_clinica INTEGER REFERENCES public.saas_clinicas(id),
    id_prompt_ia INTEGER REFERENCES public.prompts_ia(id),

    texto_bruto TEXT, -- Notas originais do terapeuta
    relatorio_gerado TEXT, -- Texto final melhorado pela IA
    status TEXT DEFAULT 'rascunho', -- 'rascunho', 'finalizado'
    visivel_familia BOOLEAN DEFAULT FALSE, -- Controle de visibilidade para o Portal da Família

    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
