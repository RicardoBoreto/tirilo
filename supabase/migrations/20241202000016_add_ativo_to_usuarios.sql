-- Add 'ativo' column to usuarios table if it doesn't exist
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Update RLS policies to potentially filter inactive users if needed, 
-- but usually we want to see them in the list to reactivate them.
-- For now, just adding the column is enough for the UI to filter.
