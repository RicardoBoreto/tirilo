-- ============================================
-- SaaS Tirilo - Setup Completo do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar a tabela saas_clinicas (se não existir)
CREATE TABLE IF NOT EXISTS saas_clinicas (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text UNIQUE,
  logo_url text,
  status_assinatura text DEFAULT 'ativo' CHECK (status_assinatura IN ('ativo', 'inativo', 'suspenso')),
  config_cor_primaria text DEFAULT '#3b82f6',
  plano_atual text DEFAULT 'basico' CHECK (plano_atual IN ('basico', 'profissional', 'empresarial'))
);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_saas_clinicas_cnpj ON saas_clinicas(cnpj);
CREATE INDEX IF NOT EXISTS idx_saas_clinicas_status ON saas_clinicas(status_assinatura);
CREATE INDEX IF NOT EXISTS idx_saas_clinicas_created_at ON saas_clinicas(created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE saas_clinicas ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON saas_clinicas;
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON saas_clinicas;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON saas_clinicas;
DROP POLICY IF EXISTS "Permitir exclusão para autenticados" ON saas_clinicas;
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON saas_clinicas;

-- 5. Criar política RLS: Permitir TUDO para usuários autenticados
-- (Simplificado para a base funcional - ajuste conforme necessário)
CREATE POLICY "Permitir tudo para autenticados"
ON saas_clinicas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Inserir dados de exemplo (opcional - remova se não quiser)
INSERT INTO saas_clinicas (razao_social, nome_fantasia, cnpj, status_assinatura, plano_atual, config_cor_primaria)
VALUES 
  ('Clínica Exemplo LTDA', 'Clínica Exemplo', '12.345.678/0001-90', 'ativo', 'profissional', '#3b82f6'),
  ('Consultório Médico ABC', 'ABC Saúde', '98.765.432/0001-10', 'ativo', 'basico', '#10b981'),
  ('Centro de Saúde XYZ', 'XYZ Clínicas', '11.222.333/0001-44', 'suspenso', 'empresarial', '#f59e0b')
ON CONFLICT (cnpj) DO NOTHING;

-- 7. Verificar se tudo foi criado corretamente
SELECT 
  'Tabela criada com sucesso!' as status,
  COUNT(*) as total_clinicas
FROM saas_clinicas;

-- ============================================
-- POLÍTICAS RLS AVANÇADAS (Opcional - para produção)
-- ============================================

-- Se você quiser implementar multi-tenancy no futuro,
-- descomente e ajuste as políticas abaixo:

/*
-- Criar tabela de usuários da clínica (relacionamento)
CREATE TABLE IF NOT EXISTS clinica_usuarios (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  clinica_id bigint REFERENCES saas_clinicas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(clinica_id, user_id)
);

-- Política: Usuários só veem clínicas às quais pertencem
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON saas_clinicas;

CREATE POLICY "Usuários veem suas clínicas"
ON saas_clinicas FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT clinica_id 
    FROM clinica_usuarios 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins podem inserir clínicas"
ON saas_clinicas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clinica_usuarios 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar suas clínicas"
ON saas_clinicas FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT clinica_id 
    FROM clinica_usuarios 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins podem excluir suas clínicas"
ON saas_clinicas FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT clinica_id 
    FROM clinica_usuarios 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
*/

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para verificar as políticas RLS criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'saas_clinicas';

-- Para verificar os dados inseridos:
-- SELECT * FROM saas_clinicas ORDER BY created_at DESC;
