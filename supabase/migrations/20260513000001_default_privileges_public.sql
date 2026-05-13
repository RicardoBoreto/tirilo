-- Garante acesso automatico a tabelas e sequences futuras no schema public
-- Sem isso, novas tabelas criadas apos out/2026 nao serao acessiveis via supabase-js (erro 42501)

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
