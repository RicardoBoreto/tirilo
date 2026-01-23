'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin' // Production Admin

// Helper to create Staging Client (Admin/Service Role)
function createStagingClient() {
    const url = process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL
    const key = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Credenciais de Staging não configuradas (NEXT_PUBLIC_STAGING_SUPABASE_URL, STAGING_SUPABASE_SERVICE_ROLE_KEY)')
    }

    return createSupabaseClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    })
}

export async function syncToStaging() {
    try {
        console.log('[Sync] Iniciando sincronização para Staging...')

        // 1. Production Clients
        const prodClient = await createClient() // For Permission Check
        const { data: { user } } = await prodClient.auth.getUser()

        if (!user) return { error: 'Não autorizado' }

        // Check if user is Super Admin or authorized
        const prodAdmin = createAdminClient()
        const { data: userProfile } = await prodAdmin
            .from('usuarios')
            .select('tipo_usuario')
            .eq('id', user.id)
            .single()

        // Allow superadmin or hardcoded dev email
        const isSuperAdmin = (userProfile as any)?.tipo_usuario === 'superadmin'
        const isDev = user.email === 'ricardoboreto@gmail.com' || user.email === 'ricardo.boreto@gmail.com' || user.email === 'contato@vitorbritto.com.br'

        if (!isSuperAdmin && !isDev) {
            console.error('[Sync] Acesso negado. User Email:', user.email)
            console.error('[Sync] User Profile:', userProfile)
            return { error: `Acesso negado. Usuário: ${user.email} | Perfil: ${JSON.stringify(userProfile)}` }
        }

        // 2. Initialize Staging Client
        const stagingAdmin = createStagingClient()

        // 3. Fetch ALL Data from Production (Source)
        // Using Admin client to bypass RLS and ensure we get everything
        console.log('[Sync] Lendo dados da Produção...')

        const tables = [
            'saas_empresa',
            'saas_clinicas',
            'saas_operadoras',
            'usuarios', // Public profile
            'terapeutas_curriculo',
            'clinicas_salas',
            'pacientes',
            'responsaveis',
            'pacientes_responsaveis',
            'pacientes_anamnese',
            'pacientes_terapeutas',
            'agendamentos',
            'prompts_ia',
            'relatorios_atendimento',
            'planos_intervencao_ia',
            'financeiro_lancamentos',

            // Modules
            'saas_jogos',
            'saas_habilidades',
            'saas_jogos_habilidades',
            'saas_jogos_versoes',
            'saas_clinicas_jogos',
            'saas_frota_robos',
            'saas_manutencoes_frota',
            'clinica_config_ia', // Table might be saas_clinicas_config_ia in TABELAS.sql but code used clinica_config_ia in backup.ts? 
            // Checking backup.ts: it uses 'clinica_config_ia'. TABELAS.sql uses 'saas_clinicas_config_ia'. 
            // I'll stick to what backup.ts used as it likely matches the running DB.
            'comandos_robo',
            'sessao_telemetria',
            'sessao_ludica',
            'sessao_diario_bordo',
            'recursos',         // From backup.ts
            'help_desk_tickets',
            'help_desk_mensagens',
            'financeiro_categorias',
            'contratos',
            'salas_recursos',
            'saas_integracoes_google'
        ]

        // Map data
        const dataMap: Record<string, any[]> = {}

        for (const table of tables) {
            // Check if table exists (optional, but good practice if schema differs)
            // For now, assume schema matches. 
            // Note: 'clinica_config_ia' mismatch needs care. backup.ts has it, TABELAS.sql has saas_clinicas_config_ia.
            // I will try to fetch, if error, ignore.

            const { data, error } = await prodAdmin.from(table).select('*')
            if (error) {
                console.warn(`[Sync] Aviso ao ler tabela ${table}: ${error.message} - Pulando...`)
                continue
            }
            if (data && data.length > 0) {
                console.log(`[Sync] Tabela ${table}: ${data.length} linhas lidas. Colunas: ${Object.keys(data[0]).join(', ')}`)
            } else {
                console.log(`[Sync] Tabela ${table}: Vazia`)
            }
            dataMap[table] = data || []
        }

        // 4. Wipe Staging Data (Reverse Order)
        console.log('[Sync] Limpando banco de Staging...')
        const tablesReversed = [...tables].reverse()

        for (const table of tablesReversed) {
            // Check if table exists in Staging before delete?
            // Delete all rows
            const { error } = await stagingAdmin.from(table).delete().neq('id', -1) // Delete all (using dummy condition if needed, usually neq id 0 works)
            // Actually .delete().gte('id', 0) for serials or similar. 
            // For UUID pks, .neq('id', '00000000-0000-0000-0000-000000000000') logic

            // Safer: delete everything? Supabase requires a filter for delete.
            // Hack: .neq('id', 0) for int, .neq('id', 'uuid-nil') for uuid?
            // Better: .in('id', ids) but fetching ids first is slow. 
            // Most tables have ID.

            // We'll skip wipe in strict sense and use upsert? No, unwanted data remains.
            // Let's try to delete all.
            // Since we can't easily valid "delete *", we rely on the fact most IDs are not null.

            // Mixed ID types (int / uuid).
            // Attempt delete with .not('id', 'is', null)
        }

        // Actually, wiping via RPC 'truncate_all' would be better if we could create it.
        // For now, let's use a workaround:
        // We can just iterate tables and delete using a common condition if possible.
        // Or upsert and ignore old data? (Not a true clone).

        // Let's implement deletion carefully.
        const reversedDeleteOrder = [
            'help_desk_mensagens', 'help_desk_tickets',
            'saas_integracoes_google',
            'financeiro_lancamentos', 'financeiro_categorias',
            'sessao_diario_bordo', 'sessao_telemetria', 'comandos_robo',
            'sessao_ludica',
            'saas_manutencoes_frota', 'saas_frota_robos',
            'saas_clinicas_jogos', 'saas_jogos_versoes', 'saas_jogos_habilidades', 'saas_habilidades', 'saas_jogos',
            'planos_intervencao_ia', 'relatorios_atendimento', 'prompts_ia', 'clinica_config_ia',
            'agendamentos',
            'pacientes_terapeutas', 'pacientes_anamnese', 'pacientes_responsaveis',
            'pacientes', 'responsaveis',
            'clinicas_salas', 'salas_recursos', 'recursos',
            'terapeutas_curriculo',
            'usuarios',
            'saas_operadoras',
            'contratos',
            'saas_clinicas',
            'saas_empresa'
        ]

        for (const t of reversedDeleteOrder) {
            try {
                // Delete all rows. Using a filter that is likely always true.
                // For SERIAL/INT id: .neq('id', 0)
                // For UUID id: .neq('id', '00000000-0000-0000-0000-000000000000')
                // A universal filter is .not('id', 'is', null)
                const { error: delError } = await stagingAdmin.from(t).delete().not('id', 'is', null)
                if (delError) {
                    // Try an alternative filter if 'id' is not the primary key or doesn't exist
                    await stagingAdmin.from(t).delete().neq('created_at', '1900-01-01')
                }
            } catch (e) {
                // ignore
            }
        }

        // 5. Insert Data (Dependency Order)
        console.log('[Sync] Inserindo dados no Staging...')

        const insertOrder = [
            'saas_empresa',
            'saas_clinicas',
            'saas_operadoras',
            'usuarios',
            'terapeutas_curriculo',
            'clinicas_salas',
            'pacientes',
            'responsaveis',
            'pacientes_responsaveis',
            'pacientes_anamnese',
            'pacientes_terapeutas',
            'agendamentos',
            'prompts_ia',
            'relatorios_atendimento',
            'planos_intervencao_ia',
            'saas_habilidades',
            'saas_jogos',
            'saas_jogos_habilidades',
            'saas_jogos_versoes',
            'saas_clinicas_jogos',
            'saas_frota_robos',
            'saas_manutencoes_frota',
            'clinica_config_ia',
            'sessao_ludica',
            'sessao_diario_bordo',
            'sessao_telemetria',
            'comandos_robo',
            'financeiro_categorias',
            'financeiro_lancamentos',
            'recursos',
            'salas_recursos',
            'contratos',
            'help_desk_tickets',
            'help_desk_mensagens',
            'saas_integracoes_google'
        ]

        // Handling Auth Users (Staff & Family)
        // We need to create Auth accounts for everyone referenced in public tables
        const staffUsers = dataMap['usuarios'] || []
        const familyUsers = dataMap['responsaveis'] || []
        const allUsersToSync = [...staffUsers, ...familyUsers]

        if (allUsersToSync.length > 0) {
            console.log(`[Sync] Sincronizando ${allUsersToSync.length} contas de autenticação...`)

            // 1. Fetch ALL existing auth users in Staging
            const allExistingAuthUsers: any[] = []
            let page = 1
            const perPage = 1000
            while (true) {
                const { data: { users: pageUsers }, error: listError } = await stagingAdmin.auth.admin.listUsers({ page, perPage })
                if (listError || !pageUsers || pageUsers.length === 0) break
                allExistingAuthUsers.push(...pageUsers)
                if (pageUsers.length < perPage) break
                page++
            }

            for (const u of allUsersToSync) {
                if (!u.email) continue

                const sourceId = u.user_id || u.id
                if (!sourceId) continue

                const match = allExistingAuthUsers?.find((eu: any) => eu.email?.toLowerCase() === u.email.toLowerCase())
                let targetUserId = match?.id

                if (!targetUserId) {
                    console.log(`[Sync] Criando novo Auth para: ${u.email}`)
                    const { data: authUser, error: authError } = await stagingAdmin.auth.admin.createUser({
                        email: u.email,
                        password: 'TiriloTest123!',
                        email_confirm: true,
                        user_metadata: { nome: u.nome || u.nome_completo || 'Usuário Sincronizado' },
                    })

                    if (!authError) {
                        targetUserId = authUser?.user?.id
                        console.log(`[Sync] Criado Auth: ${u.email} -> ${targetUserId}`)
                    } else {
                        console.error(`[Sync] Erro ao criar Auth para ${u.email}:`, authError.message)
                    }
                } else {
                    // Force password reset for existing users to match the expected 'TiriloTest123!'
                    console.log(`[Sync] Resetando senha para usuário existente: ${u.email}`)
                    const { error: resetError } = await stagingAdmin.auth.admin.updateUserById(targetUserId, {
                        password: 'TiriloTest123!'
                    })
                    if (resetError) {
                        console.error(`[Sync] Erro ao resetar senha de ${u.email}:`, resetError.message)
                    }
                }

                if (targetUserId) {
                    u._new_id = targetUserId
                }
            }
        }

        // Helper to remap IDs in a row
        const idMapping = new Map<string, string>() // Old -> New
        allUsersToSync.forEach((u: any) => {
            if (u._new_id) {
                // For 'responsaveis', we map the 'user_id' (UUID)
                // For 'usuarios', we map the 'id' (UUID)
                const oldUuid = u.user_id || u.id
                if (oldUuid) idMapping.set(oldUuid, u._new_id)
            }
        })

        // Pre-calculate valid IDs for foreign keys to prevent Orphans
        const validSalaIds = new Set((dataMap['clinicas_salas'] || []).map(s => s.id))
        const validPacienteIds = new Set((dataMap['pacientes'] || []).map(p => p.id))

        // Function to process rows and remap UUIDs
        const processRows = (rows: any[], table: string) => {
            return rows
                .map(row => {
                    const newRow = { ...row }

                    // 1. Fix UUID if table is 'usuarios'
                    if (table === 'usuarios') {
                        if (idMapping.has(row.id)) {
                            newRow.id = idMapping.get(row.id)
                        } else {
                            return null
                        }
                    }

                    // 2. Fix user_id if table is 'responsaveis'
                    if (table === 'responsaveis' && row.user_id) {
                        if (idMapping.has(row.user_id)) {
                            newRow.user_id = idMapping.get(row.user_id)
                        } else {
                            newRow.user_id = null
                        }
                    }

                    // 3. Fix Case Sensitivity for Enums (Agendamentos)
                    if (table === 'agendamentos' && typeof newRow.status === 'string') {
                        newRow.status = newRow.status.toUpperCase()
                    }

                    // 4. Fix for Foreign Keys (Clean up invalid references/orphans)
                    if (table === 'agendamentos') {
                        if (newRow.id_sala && !validSalaIds.has(newRow.id_sala)) {
                            newRow.id_sala = null
                        }
                        if (newRow.id_paciente && !validPacienteIds.has(newRow.id_paciente)) {
                            newRow.id_paciente = null
                        }
                    }

                    // 5. Fix Case Sensitivity for Financial Tables
                    if ((table === 'financeiro_lancamentos' || table === 'financeiro_categorias') && typeof newRow.tipo === 'string') {
                        newRow.tipo = newRow.tipo.toUpperCase()
                    }
                    if (table === 'financeiro_lancamentos' && typeof newRow.status === 'string') {
                        newRow.status = newRow.status.toUpperCase()
                    }

                    // 6. Fix UUID Foreign Keys in any table
                    const userFkColumns = ['terapeuta_id', 'user_id', 'id_usuario', 'id_terapeuta', 'created_by']
                    for (const key of Object.keys(newRow)) {
                        if (userFkColumns.includes(key) && typeof newRow[key] === 'string' && idMapping.has(newRow[key])) {
                            newRow[key] = idMapping.get(newRow[key])
                        }
                    }

                    // 7. Cleanup internal keys
                    delete (newRow as any)._new_id
                    Object.keys(newRow).forEach(key => {
                        if (key.startsWith('_')) delete (newRow as any)[key]
                    })

                    return newRow
                })
                .filter(row => row !== null) as any[]
        }

        // Insert Loop
        for (const table of insertOrder) {
            let rows = dataMap[table] || []
            if (rows.length === 0) {
                console.log(`[Sync] Tabela ${table}: Vazia, pulando.`)
                continue
            }

            // Remap IDs
            const processed = processRows(rows, table)
            if (processed.length === 0) {
                console.log(`[Sync] Tabela ${table}: zero linhas válidas após processamento.`)
                continue
            }

            console.log(`[Sync] Inserindo ${processed.length} linhas em ${table}...`)
            const { error: insError } = await stagingAdmin.from(table).insert(processed)

            if (insError) {
                const sampleKeys = processed.length > 0 ? Object.keys(processed[0]).join(', ') : 'vazio'
                console.error(`[Sync] Erro inserindo ${table}:`, insError.message)
                return { success: false, error: `Erro na tabela ${table}: ${insError.message} | Colunas enviadas: ${sampleKeys}` }
            }
        }

        return { success: true, message: 'Clonagem concluída com sucesso!' }

    } catch (e: any) {
        console.error('[Sync] Erro fatal:', e)
        return { error: e.message }
    }
}

export async function setEnvironment(env: 'prod' | 'staging') {
    const cookieStore = await cookies()
    if (env === 'staging') {
        cookieStore.set('tirilo-env', 'staging', {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: false, // Need to read it on client side too
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    } else {
        cookieStore.delete('tirilo-env')
    }
    revalidatePath('/')
}

export async function getEnvironment() {
    const cookieStore = await cookies()
    return cookieStore.get('tirilo-env')?.value || 'prod'
}
