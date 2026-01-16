-- Criar bucket 'logos' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para Logos (Leitura Pública)
DROP POLICY IF EXISTS "Logos Public Read" ON storage.objects;
CREATE POLICY "Logos Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Política para Logos Upload (Autenticado)
DROP POLICY IF EXISTS "Logos Upload Authenticated" ON storage.objects;
CREATE POLICY "Logos Upload Authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Política para Logos Update (Autenticado)
DROP POLICY IF EXISTS "Logos Update Authenticated" ON storage.objects;
CREATE POLICY "Logos Update Authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');
