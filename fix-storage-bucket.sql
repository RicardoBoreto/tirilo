-- ============================================
-- Verificar e Corrigir Bucket de Laudos
-- Execute este script para diagnosticar problemas de upload
-- ============================================

-- 1. Verificar se o bucket existe
SELECT 
    id, 
    name, 
    public,
    created_at
FROM storage.buckets 
WHERE id = 'laudos';

-- Se não retornar nada, criar o bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Verificar políticas existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Laudos da clínica" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 4. Criar políticas corretas para o bucket laudos

-- Política para INSERT (upload)
CREATE POLICY "Laudos - Upload permitido"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'laudos');

-- Política para SELECT (download/visualização)
CREATE POLICY "Laudos - Leitura permitida"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'laudos');

-- Política para UPDATE (atualização)
CREATE POLICY "Laudos - Atualização permitida"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'laudos')
WITH CHECK (bucket_id = 'laudos');

-- Política para DELETE (exclusão)
CREATE POLICY "Laudos - Exclusão permitida"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'laudos');

-- 5. Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd as operacao,
    CASE 
        WHEN roles = '{authenticated}' THEN 'Usuários autenticados'
        ELSE roles::text
    END as quem_pode
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'Laudos%';

-- 6. Testar permissões (execute como usuário autenticado)
-- Este SELECT deve retornar vazio se não houver arquivos ainda
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'laudos'
LIMIT 5;

-- 7. Informações do bucket
SELECT 
    'Bucket configurado corretamente!' as status,
    id,
    name,
    CASE WHEN public THEN 'Público' ELSE 'Privado' END as visibilidade,
    created_at as criado_em
FROM storage.buckets 
WHERE id = 'laudos';
