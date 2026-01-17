
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('Buscando Prompt...')
    const { data: prompts } = await supabase
        .from('prompts_ia')
        .select('id')
        .eq('nome_prompt', 'Relatório Ludoterapia (Padrão Murilo)')

    if (!prompts || prompts.length === 0) { console.error('Prompt não encontrado'); return }
    const promptId = prompts[0].id

    console.log('Buscando Terapeuta Ricardo...')
    // Buscando pelo email que vi no diagnose "ricardo@acolherjp.com.br"
    const { data: users } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email')
        .eq('email', 'ricardo@acolherjp.com.br')
        .single()

    if (!users) {
        console.error('Usuário Ricardo não encontrado. Tentando busca genérica...')
        // Fallback
        return
    }

    console.log(`Transferindo prompt ${promptId} para ${users.nome_completo} (${users.id})...`)
    const { error } = await supabase
        .from('prompts_ia')
        .update({ terapeuta_id: users.id })
        .eq('id', promptId)

    if (error) console.error('Erro:', error)
    else console.log('Sucesso! O prompt agora pertence ao terapeuta e deve aparecer na lista.')
}

run()
