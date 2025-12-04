-- ============================================
-- CRIAR BUCKET DE LAUDOS - EXECUTAR URGENTE
-- ============================================

-- 1. Criar o bucket (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Verificar se foi criado
SELECT 
    id,
    name,
    public,
    created_at,
    'Bucket criado com sucesso!' as status
FROM storage.buckets 
WHERE id = 'laudos';

-- Se não aparecer nada acima, o bucket não existe ainda!
-- Execute novamente o INSERT acima.
