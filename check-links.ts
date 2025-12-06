
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLinks() {
    console.log('Checking pacientes_terapeutas...')
    const { data: links, error: linkError } = await supabase
        .from('pacientes_terapeutas')
        .select('*')

    if (linkError) console.error(linkError)
    console.log('Links found:', links?.length)
    if (links && links.length > 0) console.log(links)

    console.log('\nChecking users (terapeutas)...')
    const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome_completo, tipo_perfil, id_clinica')
        .eq('tipo_perfil', 'terapeuta')

    if (userError) console.error(userError)
    console.log('Therapists found:', users)

    console.log('\nChecking pacientes...')
    const { data: pacientes, error: pacError } = await supabase
        .from('pacientes')
        .select('id, nome, id_clinica')

    if (pacError) console.error(pacError)
    console.log('Pacientes:', pacientes)
}

checkLinks()
