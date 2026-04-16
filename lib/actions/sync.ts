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

// Order management to preserve Foreign Keys
const CORE_INSERT_ORDER = [
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
    'saas_perfis_robo',
    'saas_frota_robos',
    'saas_manutencoes_frota',
    'clinica_config_ia',
    'saas_diretrizes_ai',
    'saas_config_global',
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

const CORE_DELETE_ORDER = [...CORE_INSERT_ORDER].reverse()

export async function syncToStaging() {
    try {
        console.log('[Sync] Iniciando sincronização dinâmica com verificação de estrutura...')

        // 1. Production Clients
        const prodClient = await createClient() 
        const { data: { user } } = await prodClient.auth.getUser()

        if (!user) return { error: 'Não autorizado' }

        const prodAdmin = createAdminClient()
        const { data: userProfile } = await prodAdmin
            .from('usuarios')
            .select('tipo_usuario, tipo_perfil, id_clinica')
            .eq('id', user.id)
            .single()

        // Safety: Only Super Admin (no id_clinica) can clone the whole DB
        if (userProfile?.id_clinica) {
            return { error: 'Acesso negado. Apenas o administrador do SaaS pode realizar o clone completo do sistema.' }
        }

        const isSuperAdmin = (userProfile as any)?.tipo_usuario === 'superadmin' || (userProfile as any)?.tipo_perfil === 'admin'
        const isDev = user.email === 'ricardoboreto@gmail.com' || user.email === 'ricardo.boreto@gmail.com' || user.email === 'contato@vitorbritto.com.br'

        if (!isSuperAdmin && !isDev) {
            return { error: `Acesso negado para ${user.email}. Recurso exclusivo de Super Admin.` }
        }

        // 2. Discover Tables in Production (Source)
        const { data: prodTables, error: prodTablesError } = await prodAdmin.rpc('get_public_tables')
        if (prodTablesError) {
            return { error: 'Erro ao ler estrutura de Produção. Verifique se a função get_public_tables existe no banco PROD.' }
        }

        const sourceTables = prodTables.map((t: any) => t.table_name)

        // 3. Initialize Staging Client & Check Structure (Target)
        const stagingAdmin = createStagingClient()
        const { data: stagingTables, error: stagingTablesError } = await stagingAdmin.rpc('get_public_tables')

        if (stagingTablesError) {
            return { 
                error: 'O ambiente de Staging parece estar vazio ou desatualizado. Por favor, execute o script do Schema (TABELAS.sql) no SQL Editor do Staging antes de clonar os dados.' 
            }
        }

        const targetTables = stagingTables.map((t: any) => t.table_name)
        const missingInStaging = sourceTables.filter((t: string) => !targetTables.includes(t))

        if (missingInStaging.length > 0) {
            return { 
                error: `Inconsistência de Estrutura: O banco de Staging está faltando as seguintes tabelas: [${missingInStaging.join(', ')}]. Atualize o Staging com as migrations mais recentes.` 
            }
        }

        // 4. Determine Orders
        const extraTables = sourceTables.filter((t: string) => !CORE_INSERT_ORDER.includes(t))
        const finalInsertOrder = [...CORE_INSERT_ORDER.filter(t => sourceTables.includes(t)), ...extraTables]
        const finalDeleteOrder = [...extraTables, ...CORE_DELETE_ORDER.filter(t => sourceTables.includes(t))]

        console.log(`[Sync] Estrutura validada. Sincronizando ${finalInsertOrder.length} tabelas...`)

        // 5. Fetch ALL Data from Production
        const dataMap: Record<string, any[]> = {}
        for (const table of finalInsertOrder) {
            const { data, error } = await prodAdmin.from(table).select('*')
            if (error) {
                console.warn(`[Sync] Aviso ao ler tabela ${table}: ${error.message}`)
                continue
            }
            dataMap[table] = data || []
        }

        // 6. Wipe Staging Data (Safe Reverse Order)
        console.log('[Sync] Limpando banco de Staging...')
        for (const table of finalDeleteOrder) {
            // Try deleting by 'id' first
            const { error: delError } = await stagingAdmin.from(table).delete().not('id', 'is', null)

            // If "id" doesn't exist, try common alternatives for global/composite tables
            if (delError && (delError.message.includes('column "id" does not exist') || delError.code === '42703')) {
                await stagingAdmin.from(table).delete().not('key', 'is', null)
            }
        }

        // 7. Handling Auth Users (Syncing IDs)
        const staffUsers = dataMap['usuarios'] || []
        const familyUsers = dataMap['responsaveis'] || []
        const allUsersToSync = [...staffUsers, ...familyUsers]

        const idMapping = new Map<string, string>()

        if (allUsersToSync.length > 0) {
            console.log(`[Sync] Sincronizando contas de autenticação...`)
            const allExistingStagingAuth: any[] = []
            let page = 1
            while (true) {
                const { data: { users }, error } = await stagingAdmin.auth.admin.listUsers({ page, perPage: 1000 })
                if (error || !users || users.length === 0) break
                allExistingStagingAuth.push(...users)
                if (users.length < 1000) break
                page++
            }

            for (const u of allUsersToSync) {
                if (!u.email) continue
                const sourceId = u.user_id || u.id
                if (!sourceId) continue

                const match = allExistingStagingAuth.find(eu => eu.email?.toLowerCase() === u.email.toLowerCase())
                let targetUserId = match?.id

                if (!targetUserId) {
                    const { data: authUser, error: authError } = await stagingAdmin.auth.admin.createUser({
                        email: u.email,
                        password: 'TiriloTest123!',
                        email_confirm: true,
                        user_metadata: { nome: u.nome || u.nome_completo || 'Usuário Sincronizado' },
                    })
                    if (!authError) targetUserId = authUser?.user?.id
                } else {
                    await stagingAdmin.auth.admin.updateUserById(targetUserId, { password: 'TiriloTest123!' })
                }
                if (targetUserId) idMapping.set(sourceId, targetUserId)
            }
        }

        // 8. Insert Data (Dependency Order)
        console.log('[Sync] Inserindo dados no Staging...')
        
        const validSalaIds = new Set((dataMap['clinicas_salas'] || []).map(s => s.id))
        const validPacienteIds = new Set((dataMap['pacientes'] || []).map(p => p.id))

        for (const table of finalInsertOrder) {
            const rows = dataMap[table] || []
            if (rows.length === 0) continue

            const processedRows = rows.map(row => {
                const newRow = { ...row }
                if (table === 'usuarios' && idMapping.has(row.id)) {
                    newRow.id = idMapping.get(row.id)
                } else if (table === 'usuarios') {
                    return null
                }
                if (table === 'responsaveis' && row.user_id && idMapping.has(row.user_id)) {
                    newRow.user_id = idMapping.get(row.user_id)
                }
                const fkColumns = ['terapeuta_id', 'user_id', 'id_usuario', 'id_terapeuta', 'created_by']
                for (const col of fkColumns) {
                    if (newRow[col] && idMapping.has(newRow[col])) {
                        newRow[col] = idMapping.get(newRow[col])
                    }
                }
                const enumCols = ['status', 'tipo']
                for (const col of enumCols) {
                    if (newRow[col] && typeof newRow[col] === 'string') {
                        newRow[col] = newRow[col].toUpperCase()
                    }
                }
                if (table === 'agendamentos') {
                    if (newRow.id_sala && !validSalaIds.has(newRow.id_sala)) newRow.id_sala = null
                    if (newRow.id_paciente && !validPacienteIds.has(newRow.id_paciente)) newRow.id_paciente = null
                }
                Object.keys(newRow).forEach(key => { if (key.startsWith('_')) delete (newRow as any)[key] })
                return newRow
            }).filter(r => r !== null)

            if (processedRows.length > 0) {
                const { error: insError } = await stagingAdmin.from(table).insert(processedRows)
                if (insError) {
                    // Specific error mapping for structural issues
                    if (insError.message.includes('column') && insError.message.includes('not exist')) {
                        return { error: `Estrutura Inconsistente: A tabela '${table}' em Staging está com colunas diferentes de Produção. Por favor, rode as migrations no Staging.` }
                    }
                    return { error: `Erro na tabela ${table}: ${insError.message}` }
                }
            }
        }

        return { success: true, message: 'Clonagem dinâmica e validada concluída com sucesso!' }

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
            httpOnly: false,
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
