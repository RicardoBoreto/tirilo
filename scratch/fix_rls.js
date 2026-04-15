const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLS() {
    const sql = `
        -- Simplificar a política de relacionamentos
        DROP POLICY IF EXISTS "isolate_relationships_select" ON public.pacientes_terapeutas;
        CREATE POLICY "terapeutas_view_own_relationships" 
        ON public.pacientes_terapeutas 
        FOR SELECT 
        USING (terapeuta_id = auth.uid());

        -- Garantir que a política de pacientes seja robusta e use o clinic ID
        DROP POLICY IF EXISTS "isolate_by_clinic_select" ON public.pacientes;
        CREATE POLICY "isolate_by_clinic_select" 
        ON public.pacientes 
        FOR SELECT 
        USING (id_clinica = (SELECT id_clinica FROM usuarios WHERE id = auth.uid()));
    `;

    const { error } = await supabase.rpc('run_sql', { sql_query: sql });
    
    if (error) {
        console.error('Erro ao executar SQL:', error);
        // Se falhar o RPC, tentamos uma alternativa comum:
        const { error: error2 } = await supabase.rpc('exec_sql', { query: sql });
        if (error2) console.error('Erro no exec_sql também:', error2);
    } else {
        console.log('Políticas de RLS atualizadas com sucesso!');
    }
}

fixRLS();
