-- Add price to games
ALTER TABLE saas_jogos ADD COLUMN preco DECIMAL(10,2) DEFAULT 0.00;

-- Create link table for clinic access
CREATE TABLE IF NOT EXISTS saas_clinicas_jogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id BIGINT NOT NULL REFERENCES saas_clinicas(id) ON DELETE CASCADE,
    jogo_id UUID NOT NULL REFERENCES saas_jogos(id) ON DELETE CASCADE,
    data_aquisicao TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true,
    UNIQUE(clinica_id, jogo_id)
);

-- RLS for link table
ALTER TABLE saas_clinicas_jogos ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins manage clinic games" ON saas_clinicas_jogos
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.tipo_perfil IN ('admin', 'super_admin')
        )
    );

-- Clinics can view their own games
CREATE POLICY "Clinics view own games" ON saas_clinicas_jogos
    FOR SELECT
    TO authenticated
    USING (
        clinica_id IN (
            SELECT clinica_id FROM usuarios WHERE id = auth.uid()
        )
    );
