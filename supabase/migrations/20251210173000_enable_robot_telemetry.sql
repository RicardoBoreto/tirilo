
-- Ativar RLS nas tabelas se não estiver
ALTER TABLE sessao_telemetria ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandos_robo ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT publico na telemetria (para o robô enviar dados)
CREATE POLICY "Robos enviam telemetria" ON sessao_telemetria
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Permitir SELECT em comandos_robo para o robô (anon)
CREATE POLICY "Robos leem comandos" ON comandos_robo
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Permitir UPDATE em comandos_robo (caso o robô precise atualizar status)
CREATE POLICY "Robos atualizam comandos" ON comandos_robo
    FOR UPDATE
    TO anon, authenticated
    USING (true);
