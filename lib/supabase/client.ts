import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
    // On the client side, we use document.cookie to check the environment
    const isStaging = typeof document !== 'undefined' && document.cookie.includes('tirilo-env=staging')

    const url = isStaging ? process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = isStaging ? process.env.NEXT_PUBLIC_STAGING_SUPABASE_ANON_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createBrowserClient<Database>(url, key)
}
