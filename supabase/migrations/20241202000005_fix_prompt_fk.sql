-- Drop the existing foreign key constraint
ALTER TABLE planos_intervencao_ia
DROP CONSTRAINT IF EXISTS planos_intervencao_ia_id_prompt_ia_fkey;

-- Re-add the constraint with ON DELETE SET NULL (or CASCADE if you prefer to delete plans when prompt is deleted)
-- Usually for history preservation, SET NULL is safer, or we just don't allow deleting used prompts.
-- But user wants to delete. Let's use SET NULL so the plan remains but prompt link is removed.
ALTER TABLE planos_intervencao_ia
ADD CONSTRAINT planos_intervencao_ia_id_prompt_ia_fkey
FOREIGN KEY (id_prompt_ia)
REFERENCES prompts_ia(id)
ON DELETE SET NULL;
