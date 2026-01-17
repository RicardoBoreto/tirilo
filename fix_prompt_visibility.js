
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fix() {
    console.log('--- Diagnóstico de Visibilidade ---')
    // 1. Achar o prompt
    const { data: prompts } = await supabase
        .from('prompts_ia')
        .select('*')
        .eq('nome_prompt', 'Relatório Ludoterapia (Padrão Murilo)')

    if (!prompts || prompts.length === 0) { console.error('Prompt não encontrado'); return }
    const prompt = prompts[0]
    console.log(`Prompt ID: ${prompt.id}, Dono ID: ${prompt.terapeuta_id}`)

    // 2. Ver perfil do dono
    const { data: owner } = await supabase.from('usuarios').select('*').eq('id', prompt.terapeuta_id).single()
    console.log(`Dono atual: ${owner.nome_completo} (${owner.tipo_perfil})`)

    if (owner.tipo_perfil !== 'admin' && owner.tipo_perfil !== 'super_admin') {
        console.log('Dono NÃO é admin. Terapeutas não conseguem ver prompts de outros terapeutas.')

        // 3. Achar um admin da mesma clínica
        console.log('Buscando um admin da clínica...')
        const { data: admins } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id_clinica', prompt.id_clinica)
            .in('tipo_perfil', ['admin', 'super_admin']) // super_admin corrigido? depende do enum
            .limit(1)

        if (admins && admins.length > 0) {
            const admin = admins[0]
            console.log(`Transferindo para admin: ${admin.nome_completo} (${admin.tipo_perfil})`)

            const { error } = await supabase
                .from('prompts_ia')
                .update({ terapeuta_id: admin.id })
                .eq('id', prompt.id)

            if (error) console.error('Erro ao transferir:', error)
            else console.log('Sucesso! Prompt transferido para um admin.')
        } else {
            console.error('Nenhum admin encontrado na clínica. Não é possível tornar público.')
        }
    } else {
        console.log('O dono JÁ É admin. Deveria estar visível.')
    }
}

fix()
