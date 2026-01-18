
ALTER TABLE public.financeiro_lancamentos
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

ALTER TABLE public.financeiro_lancamentos
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;

-- Create bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- Policy (optional but good practice for RLS)
-- User needs permission to upload
CREATE POLICY "Permitir Upload Comprovantes Autenticado"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Permitir Leitura Comprovantes Autenticado"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'comprovantes');
