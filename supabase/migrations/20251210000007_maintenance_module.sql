-- Create table for maintenance orders (Service Orders - OS)
CREATE TABLE IF NOT EXISTS saas_manutencoes_frota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    robo_id UUID NOT NULL REFERENCES saas_frota_robos(id) ON DELETE CASCADE,
    data_entrada TIMESTAMPTZ DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ,
    
    tipo_manutencao TEXT NOT NULL CHECK (tipo_manutencao IN ('preventiva', 'corretiva', 'upgrade', 'preparacao', 'outros')),
    status_os TEXT NOT NULL DEFAULT 'aberto' CHECK (status_os IN ('aberto', 'em_analise', 'aguardando_peca', 'em_reparo', 'testes', 'concluido', 'cancelado')),
    
    defeito_relatado TEXT,
    diagnostico_tecnico TEXT,
    solucao_aplicada TEXT,
    
    custo_total DECIMAL(10,2) DEFAULT 0.00,
    faturado_cliente BOOLEAN DEFAULT false,
    
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE saas_manutencoes_frota ENABLE ROW LEVEL SECURITY;

-- Admins manage everything
CREATE POLICY "Admins manage maintenance" ON saas_manutencoes_frota
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.tipo_perfil IN ('admin', 'super_admin')
        )
    );

-- Create index for faster lookups
CREATE INDEX idx_manutencao_robo ON saas_manutencoes_frota(robo_id);
CREATE INDEX idx_manutencao_status ON saas_manutencoes_frota(status_os);
