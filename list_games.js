
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

try {
    const envConfig = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) process.env[key.trim()] = value.trim()
    })
} catch (e) { }

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function listGames() {
    const { data: jogos, error } = await supabaseAdmin.from('saas_jogos').select('nome, categoria, preco, descricao')
    if (error) console.log(error)
    else console.log(jogos)
}

listGames()
