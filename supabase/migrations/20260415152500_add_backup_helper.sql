-- Função para listar todas as tabelas públicas (Auxiliar para o Sistema de Backup Dinâmico)
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'vault_%'
  AND t.table_name NOT LIKE '_prisma_migrations';
$$;

GRANT EXECUTE ON FUNCTION get_public_tables() TO authenticated, service_role;
