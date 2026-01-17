
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log('--- Buscando Paciente: Murilo Chavier ---')
    const { data: pacientes, error } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('nome', '%Murilo%') // Busca flexível

    if (error) {
        console.error('Erro ao buscar paciente:', error)
        return
    }

    if (!pacientes || pacientes.length === 0) {
        console.log('Nenhum Murilo encontrado.')
        return
    }

    const murilo = pacientes[0]
    console.log(`Encontrado: ${murilo.nome} (ID: ${murilo.id}, Clínica: ${murilo.clinica_id})`)

    console.log('\n--- Buscando Relatórios de Murilo ---')
    const { data: relatorios } = await supabase
        .from('relatorios_atendimento')
        .select('id, created_at, status, relatorio_gerado')
        .eq('id_paciente', murilo.id)
        .order('created_at', { ascending: false })
        .limit(3)

    if (relatorios && relatorios.length > 0) {
        relatorios.forEach(r => {
            console.log(`[${r.created_at}] Status: ${r.status}`)
            console.log(`Preview: ${r.relatorio_gerado ? r.relatorio_gerado.substring(0, 100) : 'Sem texto'}...`)
        })
    } else {
        console.log('Nenhum relatório encontrado para Murilo.')
    }

    console.log('\n--- Buscando Usuário Admin para vincular o Prompt ---')
    // Vou pegar um usuário da mesma clínica do Murilo para ser o dono do prompt
    const { data: users } = await supabase
        .from('usuarios')
        .select('id, nome_completo, tipo_perfil')
        .eq('clinica_id', murilo.clinica_id)
        .limit(5)

    console.log('Usuários da clínica:', users.map(u => `${u.nome_completo} (${u.tipo_perfil})`))
}

run()
