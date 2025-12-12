
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

async function checkCols() {
    console.log("Checking Usuarios...")
    const { data: u, error: eu } = await supabaseAdmin.from('usuarios').select('*').limit(1)
    if (u && u.length > 0) console.log("Cols Usuarios:", Object.keys(u[0]))
    else console.log("Usuarios Error/Empty:", eu)

    console.log("\nChecking Saas Clinicas...")
    const { data: c, error: ec } = await supabaseAdmin.from('saas_clinicas').select('*').limit(1)
    if (c && c.length > 0) console.log("Cols Clinicas:", Object.keys(c[0]))
    else console.log("Clinicas Error/Empty:", ec)
}

checkCols()
