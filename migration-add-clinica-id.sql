-- ============================================
-- MIGRAÇÃO: Adicionar coluna clinica_id à tabela pacientes
-- Execute este script se a tabela pacientes já existe
-- ============================================

-- Verificar se a tabela existe
DO $$ 
BEGIN
    -- Se a tabela pacientes existe mas não tem clinica_id, adicionar
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pacientes'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pacientes' 
        AND column_name = 'clinica_id'
    ) THEN
        -- Adicionar coluna clinica_id
        ALTER TABLE pacientes ADD COLUMN clinica_id bigint;
        
        -- Adicionar foreign key
        ALTER TABLE pacientes 
        ADD CONSTRAINT pacientes_clinica_id_fkey 
        FOREIGN KEY (clinica_id) 
        REFERENCES saas_clinicas(id) 
        ON DELETE CASCADE;
        
        -- Atualizar registros existentes com a primeira clínica disponível
        UPDATE pacientes 
        SET clinica_id = (SELECT id FROM saas_clinicas LIMIT 1)
        WHERE clinica_id IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE pacientes ALTER COLUMN clinica_id SET NOT NULL;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON pacientes(clinica_id);
        
        RAISE NOTICE 'Coluna clinica_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna clinica_id já existe ou tabela não existe';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
