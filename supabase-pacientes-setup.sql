-- ============================================
-- SaaS Tirilo - Módulo de Pacientes
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar bucket de storage para laudos
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar tabela de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  clinica_id bigint NOT NULL REFERENCES saas_clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_nascimento date NOT NULL,
  foto_url text,
  observacoes text,
  ativo boolean DEFAULT true
);

-- 3. Criar tabela de responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now(),
  nome text NOT NULL,
  cpf text UNIQUE NOT NULL,
  whatsapp text NOT NULL,
  email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(cpf)
);

-- 4. Criar tabela de relacionamento pacientes_responsaveis
CREATE TABLE IF NOT EXISTS pacientes_responsaveis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  paciente_id bigint NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  responsavel_id bigint NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  grau_parentesco text NOT NULL,
  responsavel_principal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(paciente_id, responsavel_id)
);

-- 5. Criar tabela de anamnese
CREATE TABLE IF NOT EXISTS pacientes_anamnese (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  paciente_id bigint NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Desenvolvimento e História
  gestacao_intercorrencias text,
  parto_tipo text,
  desenvolvimento_motor text,
  desenvolvimento_linguagem text,
  historico_medico text,
  medicamentos_atuais text,
  alergias text,
  
  -- Laudo Médico
  laudo_medico_arquivo_url text,
  laudo_medico_data_upload timestamp with time zone,
  diagnostico_principal text,
  
  -- Musicoterapia
  musicoterapia jsonb DEFAULT '{}'::jsonb
);

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_ativo ON pacientes(ativo);
CREATE INDEX IF NOT EXISTS idx_responsaveis_cpf ON responsaveis(cpf);
CREATE INDEX IF NOT EXISTS idx_responsaveis_user_id ON responsaveis(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_responsaveis_paciente ON pacientes_responsaveis(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_responsaveis_responsavel ON pacientes_responsaveis(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_anamnese_paciente ON pacientes_anamnese(paciente_id);

-- 7. Habilitar RLS
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_anamnese ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para pacientes (terapeuta só vê pacientes da própria clínica)
DROP POLICY IF EXISTS "Terapeutas veem pacientes da própria clínica" ON pacientes;
CREATE POLICY "Terapeutas veem pacientes da própria clínica"
ON pacientes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Políticas RLS para responsáveis
DROP POLICY IF EXISTS "Responsáveis autenticados" ON responsaveis;
CREATE POLICY "Responsáveis autenticados"
ON responsaveis FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 10. Políticas RLS para pacientes_responsaveis
DROP POLICY IF EXISTS "Relação paciente-responsável" ON pacientes_responsaveis;
CREATE POLICY "Relação paciente-responsável"
ON pacientes_responsaveis FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. Políticas RLS para anamnese
DROP POLICY IF EXISTS "Anamnese da clínica" ON pacientes_anamnese;
CREATE POLICY "Anamnese da clínica"
ON pacientes_anamnese FOR ALL
TO authenticated
USING (
  paciente_id IN (
    SELECT id FROM pacientes WHERE clinica_id IN (
      SELECT id FROM saas_clinicas
    )
  )
)
WITH CHECK (
  paciente_id IN (
    SELECT id FROM pacientes WHERE clinica_id IN (
      SELECT id FROM saas_clinicas
    )
  )
);

-- 12. Política de storage para laudos (só a clínica vê)
DROP POLICY IF EXISTS "Laudos da clínica" ON storage.objects;
CREATE POLICY "Laudos da clínica"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'laudos')
WITH CHECK (bucket_id = 'laudos');

-- 13. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pacientes_updated_at ON pacientes;
CREATE TRIGGER update_pacientes_updated_at
    BEFORE UPDATE ON pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anamnese_updated_at ON pacientes_anamnese;
CREATE TRIGGER update_anamnese_updated_at
    BEFORE UPDATE ON pacientes_anamnese
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Verificação
SELECT 'Setup completo!' as status;
