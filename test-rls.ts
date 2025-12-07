
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Test with ANON key to trigger RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRLS() {
    // 1. Convert service role to JWT for a specific user to test as them?
    // Hard to do without password.

    // Instead, I'll use the SERVICE key to call the function directly via RPC to check if it exists and works for a user.
    // Wait, RPC calls are also subject to permissions if not service_role.

    // Let's use service key to verify function existence/owner.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminClient = createClient(supabaseUrl, serviceKey!)

    console.log('Checking function definition...')
    const { data: funcData, error: funcError } = await adminClient.rpc('get_current_user_clinic_id')
    // This expects to be called by a user, so it might return null/empty if called by service_role (auth.uid() is null).

    if (funcError) console.error('Function RPC error:', funcError)
    else console.log('Function returned:', funcData)

    // Check specific user access via impersonation if possible?
    // Can't easily impersonate without sign in.

    // Let's check if the policies exist.
    const { data: policies, error: polError } = await adminClient
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'usuarios')

    // pg_policies is a system view, need direct SQL usually. Supabase JS client doesn't query system catalogs easily.

    console.log('Skipping complex diagnostics. Trying to list patients with service role to confirm data.')
    const { data: patients } = await adminClient.from('pacientes').select('id, nome')
    console.log('Service Role Patients:', patients?.length)
}

testRLS()
