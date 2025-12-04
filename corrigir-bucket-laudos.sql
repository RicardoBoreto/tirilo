-- ============================================
-- CORRIGIR BUCKET LAUDOS EXISTENTE
-- O bucket existe mas não está acessível
-- ============================================

-- 1. Verificar configuração atual do bucket
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'laudos';

-- 2. Atualizar bucket para privado (se estiver público)
UPDATE storage.buckets
SET public = false
WHERE id = 'laudos';

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Laudos - Upload permitido" ON storage.objects;
DROP POLICY IF EXISTS "Laudos - Leitura permitida" ON storage.objects;
DROP POLICY IF EXISTS "Laudos - Atualização permitida" ON storage.objects;
DROP POLICY IF EXISTS "Laudos - Exclusão permitida" ON storage.objects;
DROP POLICY IF EXISTS "Laudos da clínica" ON storage.objects;

-- 4. Criar políticas corretas

-- Permitir INSERT (upload)
CREATE POLICY "Laudos - Upload permitido"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'laudos');

-- Permitir SELECT (leitura/download)
CREATE POLICY "Laudos - Leitura permitida"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'laudos');

-- Permitir UPDATE
CREATE POLICY "Laudos - Atualização permitida"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'laudos')
WITH CHECK (bucket_id = 'laudos');

-- Permitir DELETE
CREATE POLICY "Laudos - Exclusão permitida"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'laudos');

-- 5. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'Laudos%'
ORDER BY policyname;

-- 6. Verificar arquivos no bucket
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'laudos'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Status final
SELECT 
    'Bucket configurado!' as status,
    CASE WHEN public THEN '⚠️ PÚBLICO (não recomendado)' ELSE '✅ PRIVADO (correto)' END as visibilidade,
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'laudos') as total_arquivos,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'Laudos%') as total_politicas
FROM storage.buckets 
WHERE id = 'laudos';
