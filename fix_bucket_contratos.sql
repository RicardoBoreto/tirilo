-- Execute este script no SQL Editor do Supabase para criar o bucket que está faltando

-- 1. Cria o bucket 'contratos' como privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos', 'contratos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança (RLS) para o bucket 'contratos'

-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload contratos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'contratos'
    AND auth.uid() IS NOT NULL
);

-- Permitir visualização (o download é via URL assinada, mas o select é necessário para checar existência)
CREATE POLICY "Users can view contratos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'contratos'
    AND auth.uid() IS NOT NULL
);

-- Permitir atualização
CREATE POLICY "Users can update contratos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'contratos'
    AND auth.uid() IS NOT NULL
);

-- Permitir deleção
CREATE POLICY "Users can delete contratos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'contratos'
    AND auth.uid() IS NOT NULL
);
