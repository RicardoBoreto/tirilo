-- Add column terapeuta_id to prompts_ia
ALTER TABLE prompts_ia ADD COLUMN IF NOT EXISTS terapeuta_id uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompts_ia_terapeuta_id ON prompts_ia(terapeuta_id);

-- Populate existing records using criado_por (assuming it holds the user ID)
UPDATE prompts_ia
SET terapeuta_id = criado_por::uuid
WHERE terapeuta_id IS NULL AND criado_por IS NOT NULL;

-- Make the column NOT NULL to enforce the rule
ALTER TABLE prompts_ia ALTER COLUMN terapeuta_id SET NOT NULL;
