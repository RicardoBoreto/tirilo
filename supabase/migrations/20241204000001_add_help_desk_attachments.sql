-- Add attachment column to help_desk_mensagens
ALTER TABLE help_desk_mensagens 
ADD COLUMN IF NOT EXISTS anexo_url TEXT,
ADD COLUMN IF NOT EXISTS anexo_nome TEXT,
ADD COLUMN IF NOT EXISTS anexo_tipo TEXT;

-- Create storage bucket for help desk attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('help-desk-anexos', 'help-desk-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for help-desk-anexos bucket
CREATE POLICY "Users can upload help desk attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'help-desk-anexos' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view help desk attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'help-desk-anexos'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their help desk attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'help-desk-anexos'
    AND auth.uid() = owner
);
