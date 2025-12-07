-- Desativar RLS temporariamente para teste conforme soliicitado
-- Isso remove todas as restrições de segurança a nível de banco de dados
-- Permitindo que o código (filtro do programa) seja o único responsável pela visualização

ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_terapeutas DISABLE ROW LEVEL SECURITY;
