-- Ensure column exists (idempotent)
ALTER TABLE prompts_ia ADD COLUMN IF NOT EXISTS terapeuta_id uuid REFERENCES auth.users(id);

-- Update from criado_por using a safe cast strategy
-- We cast to text first to handle both UUID and Text column types safely
-- Then we use NULLIF to handle empty strings
-- Finally we cast to UUID
UPDATE prompts_ia
SET terapeuta_id = CAST(NULLIF(criado_por::text, '') AS uuid)
WHERE terapeuta_id IS NULL 
  AND NULLIF(criado_por::text, '') IS NOT NULL;

-- Fallback: For records that are still NULL (e.g. legacy data with null criado_por), 
-- assign to the first found user of that clinic (likely the owner/admin)
UPDATE prompts_ia p
SET terapeuta_id = sub.id
FROM (
    SELECT DISTINCT ON (id_clinica) id_clinica, id
    FROM usuarios
    ORDER BY id_clinica, created_at ASC
) sub
WHERE p.id_clinica = sub.id_clinica
AND p.terapeuta_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompts_ia_terapeuta_id ON prompts_ia(terapeuta_id);

-- Now enforce NOT NULL
-- If there are still orphans, delete them.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM prompts_ia WHERE terapeuta_id IS NULL) THEN
        RAISE NOTICE 'Existem prompts orfãos (sem usuários na clínica). Removendo-os para aplicar a constraint.';
        DELETE FROM prompts_ia WHERE terapeuta_id IS NULL;
    END IF;
    
    ALTER TABLE prompts_ia ALTER COLUMN terapeuta_id SET NOT NULL;
END $$;
