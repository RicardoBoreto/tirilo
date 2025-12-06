-- ============================================================================
-- Migration: Adicionar bucket 'fotos' e coluna foto_url em salas
-- Data: 06/12/2025
-- Descrição: Adiciona suporte para upload de fotos de salas
-- ============================================================================

-- 1. Adicionar coluna foto_url na tabela salas_recursos (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salas_recursos' AND column_name = 'foto_url'
    ) THEN
        ALTER TABLE salas_recursos ADD COLUMN foto_url TEXT;
        COMMENT ON COLUMN salas_recursos.foto_url IS 'URL da foto da sala armazenada no Supabase Storage';
    END IF;
END $$;

-- 2. Criar bucket 'fotos' (público) se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de acesso ao bucket 'fotos'
DO $$
BEGIN
    -- Política para visualização (qualquer um pode ver)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Anyone can view fotos'
    ) THEN
        CREATE POLICY "Anyone can view fotos" ON storage.objects
        FOR SELECT USING (bucket_id = 'fotos');
    END IF;

    -- Política para upload (apenas usuários autenticados)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload fotos'
    ) THEN
        CREATE POLICY "Users can upload fotos" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'fotos'
            AND auth.uid() IS NOT NULL
        );
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
