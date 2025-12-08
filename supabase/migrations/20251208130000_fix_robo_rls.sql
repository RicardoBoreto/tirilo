-- Fix RLS policies to include super_admin
-- Drop old policies
DROP POLICY IF EXISTS "Admin vê todas frotas" ON saas_frota_robos;
DROP POLICY IF EXISTS "Admin vê configs" ON clinica_config_ia;
DROP POLICY IF EXISTS "Admin gerencia comandos" ON comandos_robo;
DROP POLICY IF EXISTS "Admin vê telemetria" ON sessao_telemetria;

-- Create new policies including super_admin
CREATE POLICY "Admin/Super vê todas frotas" ON saas_frota_robos
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));

CREATE POLICY "Admin/Super vê configs" ON clinica_config_ia
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));

CREATE POLICY "Admin/Super gerencia comandos" ON comandos_robo
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));

CREATE POLICY "Admin/Super vê telemetria" ON sessao_telemetria
    FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE tipo_perfil IN ('admin', 'super_admin')));
