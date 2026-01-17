
-- Habilita segurança a nível de linha
ALTER TABLE prompts_ia ENABLE ROW LEVEL SECURITY;

-- 1. LEITURA: Permitir ver todos os prompts da MESMA CLÍNICA
-- (A filtragem de "não ver prompts de outros terapeutas" é feita no aplicativo, mas o banco libera acesso aos dados da clínica)
DROP POLICY IF EXISTS "Leitura Prompts Clinica" ON prompts_ia;
CREATE POLICY "Leitura Prompts Clinica" ON prompts_ia
FOR SELECT
USING (
    id_clinica IN (
        SELECT id_clinica FROM usuarios WHERE id = auth.uid()
    )
);

-- 2. CRIAÇÃO: Permitir criar prompts vinculados a si mesmo
DROP POLICY IF EXISTS "Criar Prompts Próprios" ON prompts_ia;
CREATE POLICY "Criar Prompts Próprios" ON prompts_ia
FOR INSERT
WITH CHECK (
    terapeuta_id = auth.uid()
);

-- 3. EDIÇÃO: Apenas o dono pode editar
DROP POLICY IF EXISTS "Editar Prompts Próprios" ON prompts_ia;
CREATE POLICY "Editar Prompts Próprios" ON prompts_ia
FOR UPDATE
USING (
    terapeuta_id = auth.uid()
);

-- 4. EXCLUSÃO: Apenas o dono pode excluir
DROP POLICY IF EXISTS "Excluir Prompts Próprios" ON prompts_ia;
CREATE POLICY "Excluir Prompts Próprios" ON prompts_ia
FOR DELETE
USING (
    terapeuta_id = auth.uid()
);
