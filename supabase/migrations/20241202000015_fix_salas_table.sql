-- Drop the duplicate 'salas' table created by mistake
DROP TABLE IF EXISTS salas;

-- Ensure 'recepcao' profile is allowed (this part was correct)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_tipo_perfil_check') THEN 
        ALTER TABLE usuarios DROP CONSTRAINT usuarios_tipo_perfil_check; 
    END IF; 
END $$;

ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_tipo_perfil_check 
CHECK (tipo_perfil IN ('admin', 'terapeuta', 'recepcao'));

-- Ensure 'salas_recursos' has the necessary columns for our new features
-- We'll add them if they don't exist
ALTER TABLE salas_recursos ADD COLUMN IF NOT EXISTS capacidade INT DEFAULT 1;
ALTER TABLE salas_recursos ADD COLUMN IF NOT EXISTS cor_identificacao TEXT DEFAULT '#3b82f6';
ALTER TABLE salas_recursos ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT TRUE;

-- Update RLS for salas_recursos to include 'recepcao'
ALTER TABLE salas_recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salas Select Policy" ON salas_recursos;
CREATE POLICY "Salas Select Policy" ON salas_recursos
FOR SELECT
USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Salas Insert Policy" ON salas_recursos;
CREATE POLICY "Salas Insert Policy" ON salas_recursos
FOR INSERT
WITH CHECK (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
    AND 
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil IN ('admin', 'recepcao'))
);

DROP POLICY IF EXISTS "Salas Update Policy" ON salas_recursos;
CREATE POLICY "Salas Update Policy" ON salas_recursos
FOR UPDATE
USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
    AND 
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil IN ('admin', 'recepcao'))
);

DROP POLICY IF EXISTS "Salas Delete Policy" ON salas_recursos;
CREATE POLICY "Salas Delete Policy" ON salas_recursos
FOR DELETE
USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
    AND 
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_perfil = 'admin')
);
