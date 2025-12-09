-- Add version control for games

-- 1. Add current version to main table
ALTER TABLE saas_jogos 
ADD COLUMN IF NOT EXISTS versao_atual TEXT DEFAULT '1.0';

-- 2. Create versions history table
CREATE TABLE IF NOT EXISTS saas_jogos_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jogo_id UUID REFERENCES saas_jogos(id) ON DELETE CASCADE,
    versao TEXT NOT NULL,
    notas_atualizacao TEXT, -- Changelog / Description of changes
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE saas_jogos_versoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve versoes" ON saas_jogos_versoes
    FOR SELECT USING (true);

CREATE POLICY "Admin gerencia versoes" ON saas_jogos_versoes
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));
