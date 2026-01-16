-- Corrigir política de segurança para saas_empresa
-- Permitir escrita para usuários que NÃO estão vinculados a uma clínica (Super Admins)

DROP POLICY IF EXISTS "Escrita permitida apenas para Super Admin" ON public.saas_empresa;

CREATE POLICY "Escrita permitida apenas para Super Admin" ON public.saas_empresa
    FOR ALL
    TO authenticated
    USING (
        NOT EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() 
            AND id_clinica IS NOT NULL
        )
    );
