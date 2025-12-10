-- Correção de RLS para Habilidades e Jogos-Habilidades

-- 1. saas_habilidades
ALTER TABLE saas_habilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam habilidades" ON saas_habilidades
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND tipo_perfil IN ('admin', 'super_admin', 'gestor')
        )
    );

-- 2. saas_jogos_habilidades
ALTER TABLE saas_jogos_habilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos leem vinculos habilidades" ON saas_jogos_habilidades
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam vinculos habilidades" ON saas_jogos_habilidades
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND tipo_perfil IN ('admin', 'super_admin', 'gestor')
        )
    );
