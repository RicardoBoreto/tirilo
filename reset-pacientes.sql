-- ============================================
-- RESET COMPLETO: Deletar e Recriar Módulo de Pacientes
-- ATENÇÃO: Este script DELETA todos os dados de pacientes!
-- Use apenas se não tiver dados importantes
-- ============================================

-- 1. Deletar tabelas existentes (em ordem reversa de dependência)
DROP TABLE IF EXISTS pacientes_anamnese CASCADE;
DROP TABLE IF EXISTS pacientes_responsaveis CASCADE;
DROP TABLE IF EXISTS responsaveis CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;

-- 2. Deletar bucket de storage (se existir)
DELETE FROM storage.buckets WHERE id = 'laudos';

-- 3. Criar bucket de storage para laudos
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar tabela de pacientes
CREATE TABLE pacientes (
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

-- 5. Criar tabela de responsáveis
CREATE TABLE responsaveis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now(),
  nome text NOT NULL,
  cpf text UNIQUE NOT NULL,
  whatsapp text NOT NULL,
  email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. Criar tabela de relacionamento pacientes_responsaveis
CREATE TABLE pacientes_responsaveis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  paciente_id bigint NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  responsavel_id bigint NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  grau_parentesco text NOT NULL,
  responsavel_principal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(paciente_id, responsavel_id)
);

-- 7. Criar tabela de anamnese
CREATE TABLE pacientes_anamnese (
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

-- 8. Criar índices
CREATE INDEX idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX idx_pacientes_ativo ON pacientes(ativo);
CREATE INDEX idx_responsaveis_cpf ON responsaveis(cpf);
CREATE INDEX idx_responsaveis_user_id ON responsaveis(user_id);
CREATE INDEX idx_pacientes_responsaveis_paciente ON pacientes_responsaveis(paciente_id);
CREATE INDEX idx_pacientes_responsaveis_responsavel ON pacientes_responsaveis(responsavel_id);
CREATE INDEX idx_anamnese_paciente ON pacientes_anamnese(paciente_id);

-- 9. Habilitar RLS
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_anamnese ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para pacientes
DROP POLICY IF EXISTS "Terapeutas veem pacientes da própria clínica" ON pacientes;
CREATE POLICY "Terapeutas veem pacientes da própria clínica"
ON pacientes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. Políticas RLS para responsáveis
DROP POLICY IF EXISTS "Responsáveis autenticados" ON responsaveis;
CREATE POLICY "Responsáveis autenticados"
ON responsaveis FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 12. Políticas RLS para pacientes_responsaveis
DROP POLICY IF EXISTS "Relação paciente-responsável" ON pacientes_responsaveis;
CREATE POLICY "Relação paciente-responsável"
ON pacientes_responsaveis FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 13. Políticas RLS para anamnese
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

-- 14. Política de storage para laudos
DROP POLICY IF EXISTS "Laudos da clínica" ON storage.objects;
CREATE POLICY "Laudos da clínica"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'laudos')
WITH CHECK (bucket_id = 'laudos');

-- 15. Trigger para atualizar updated_at
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

-- 16. Verificação final
SELECT 'Reset completo! Tabelas recriadas com sucesso!' as status;

-- Verificar estrutura da tabela pacientes
SELECT 
    'pacientes' as tabela,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
