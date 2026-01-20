import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
    const cookieStore = await cookies()
    const env = cookieStore.get('tirilo-env')?.value || 'prod'
    const isStaging = env === 'staging'

    const url = isStaging ? process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = isStaging ? process.env.NEXT_PUBLIC_STAGING_SUPABASE_ANON_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createServerClient<Database>(
        url,
        key,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export async function createAdminClient() {
    // Note: Admin client usually operates on Prod unless specified. 
    // But for testing purposes, we might want it to respect the cookie if called from a server action context.
    const cookieStore = await cookies()
    const env = cookieStore.get('tirilo-env')?.value || 'prod'
    const isStaging = env === 'staging'

    const url = isStaging ? process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = isStaging ? process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY! : process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createServerClient<Database>(
        url,
        key,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    )
}
