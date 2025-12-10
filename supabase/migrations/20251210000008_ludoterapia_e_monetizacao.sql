-- 1. Melhorar Tabela de Jogos (Novos campos de Marketing/Busca)
-- O campo 'preco' já existe na migration 20251210000004
ALTER TABLE saas_jogos 
ADD COLUMN IF NOT EXISTS demo_video_url TEXT,
ADD COLUMN IF NOT EXISTS recursos_terapeuticos TEXT[]; -- Tags visualizáveis (ex: ["Atenção", "Cores"])

-- 2. Melhorar Licenciamento (Campos extras na tabela já existente saas_clinicas_jogos)
ALTER TABLE saas_clinicas_jogos
ADD COLUMN IF NOT EXISTS licenca_tipo TEXT DEFAULT 'PERPETUA', -- 'PERPETUA', 'MENSAL'
ADD COLUMN IF NOT EXISTS validade_ate TIMESTAMPTZ; -- NULL se perpetua

-- 3. Inteligência Clínica (Tabelas Novas)

-- Tabela de Competências/Habilidades (Para a IA entender o objetivo)
CREATE TABLE IF NOT EXISTS saas_habilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE, -- "Atenção Sustentada", "Memória de Trabalho"
    descricao TEXT,
    codigo_ia TEXT UNIQUE -- "atencao_sustentada" (chave para prompt)
);

-- Vínculo Jogo <-> Habilidade
CREATE TABLE IF NOT EXISTS saas_jogos_habilidades (
    jogo_id UUID REFERENCES saas_jogos(id) ON DELETE CASCADE,
    habilidade_id UUID REFERENCES saas_habilidades(id) ON DELETE CASCADE,
    nivel_impacto INTEGER DEFAULT 1 CHECK (nivel_impacto BETWEEN 1 AND 10),
    PRIMARY KEY (jogo_id, habilidade_id)
);

-- Policies de Leitura para Habilidades
ALTER TABLE saas_habilidades ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Todos leem habilidades" ON saas_habilidades;
    CREATE POLICY "Todos leem habilidades" ON saas_habilidades FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Sessão Lúdica (Registro Clínico do Jogo)
-- DIFERENÇA DO SESSAO_TELEMETRIA: Esta tabela liga o jogo ao PACIENTE e TERAPEUTA.
CREATE TABLE IF NOT EXISTS sessao_ludica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto
    clinica_id BIGINT REFERENCES saas_clinicas(id),
    terapeuta_id UUID REFERENCES usuarios(id),
    paciente_id BIGINT REFERENCES pacientes(id),
    robo_mac_address TEXT REFERENCES saas_frota_robos(mac_address),
    
    -- O Jogo
    jogo_id UUID REFERENCES saas_jogos(id),
    versao_jogo TEXT, -- qual versão do script rodou
    
    -- Resultados
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    data_fim TIMESTAMPTZ,
    duracao_segundos INTEGER,
    
    pontuacao_final INTEGER,
    nivel_dificuldade TEXT, -- 'FACIL', 'MEDIO', 'DIFICIL'
    
    -- Dados da Atividade
    metricas JSONB, -- { "erros": 2, "acertos": 8, "tempo_reacao_medio": 1200 }
    observacoes_terapeuta TEXT, -- Anotação manual pós-jogo
    
    status TEXT DEFAULT 'PENDENTE' -- 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'
);

-- RLS Sessão Lúdica
ALTER TABLE sessao_ludica ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Terapeuta vê sessões onde ele é o terapeuta OU o paciente é da sua clínica (se admin)
    -- Simplificando: Auth user vê sessões da sua clínica
    DROP POLICY IF EXISTS "Acesso Sessao Ludica" ON sessao_ludica;
    CREATE POLICY "Acesso Sessao Ludica" ON sessao_ludica
        FOR ALL USING (
            clinica_id IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid()) OR
            auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin') AND id_clinica IS NULL) -- SuperAdmin
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 5. Infraestrutura de Frota (Tailscale + Contratos)
-- Campos novos em saas_frota_robos
ALTER TABLE saas_frota_robos
ADD COLUMN IF NOT EXISTS endereco_tailscale TEXT, -- IP 100.x.y.z ou Hostname
ADD COLUMN IF NOT EXISTS usuario_ssh TEXT DEFAULT 'pi',
ADD COLUMN IF NOT EXISTS modelo_contrato TEXT DEFAULT 'VENDA',
ADD COLUMN IF NOT EXISTS status_financeiro TEXT DEFAULT 'ADIMPLENTE';

