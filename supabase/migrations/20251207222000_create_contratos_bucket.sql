-- Bucket: contratos (privado)
-- Descrição: Arquivos PDF dos contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos', 'contratos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança
-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload contratos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'contratos'
    AND auth.uid() IS NOT NULL
);

-- Permitir visualização para usuários autenticados (a aplicação controla quem vê via URL assinada)
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
