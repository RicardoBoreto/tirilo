-- Create table for Games
CREATE TABLE IF NOT EXISTS saas_jogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao_regras TEXT,
    indicacao TEXT,
    thumbnail_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    categoria TEXT,
    comando_entrada TEXT, -- e.g. 'games.parear_cor' or script name
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE saas_jogos ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin sees all
CREATE POLICY "Admin ve todos jogos" ON saas_jogos
    FOR SELECT USING (true); -- Simplificando leitura geral por enquanto, ou restringir a usuarios autenticados

CREATE POLICY "Admin gerencia jogos" ON saas_jogos
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));

-- Optional bucket for thumbnails if not exists
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('saas-jogos-assets', 'saas-jogos-assets', true) 
-- ON CONFLICT (id) DO NOTHING;

-- Policy for bucket
-- CREATE POLICY "Public Access Jogos Assets" ON storage.objects FOR SELECT USING (bucket_id = 'saas-jogos-assets');
-- CREATE POLICY "Admin Upload Jogos Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'saas-jogos-assets' AND auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil = 'admin'));
