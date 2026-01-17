
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function diag() {
    console.log('--- Diagnóstico de Usuários e Clínicas ---')
    const { data: users } = await supabase.from('usuarios').select('nome_completo, id_clinica, tipo_perfil, email, id')
    console.table(users)
}
diag()
