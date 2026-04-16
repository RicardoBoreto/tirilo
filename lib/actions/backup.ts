'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function generateBackup() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    // Fetch user profile to check if Super Admin
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    // Backup is only for Super Admins (those without a linked id_clinica)
    if (userProfile?.id_clinica) {
        return { error: 'Acesso negado. Apenas o administrador do SaaS pode realizar o backup completo do sistema.' }
    }

    // Use ADMIN CLIENT to bypass RLS and get ALL data
    const adminClient = await createAdminClient()

    // 1. Get List of all Tables (Dynamic)
    let tablesToBackup: string[] = []
    const { data: tablesData, error: tablesError } = await adminClient.rpc('get_public_tables')

    if (tablesError) {
        console.warn('Falha ao obter lista dinâmica de tabelas (RPC get_public_tables não encontrada?). Usando lista fixa de segurança.', tablesError)
        // Fallback robusto caso a migration ainda não tenha sido aplicada
        tablesToBackup = [
            'saas_empresa', 'saas_clinicas', 'usuarios', 'terapeutas_curriculo',
            'pacientes', 'pacientes_responsaveis', 'pacientes_terapeutas', 'pacientes_anamnese',
            'responsaveis', 'agendamentos', 'financeiro_categorias', 'financeiro_lancamentos',
            'saas_habilidades', 'saas_jogos', 'saas_jogos_habilidades', 'saas_jogos_versoes',
            'saas_clinicas_jogos', 'saas_perfis_robo', 'saas_frota_robos', 'clinica_config_ia',
            'saas_diretrizes_ai', 'saas_config_global', 'sessao_ludica', 'sessao_diario_bordo',
            'sessao_telemetria', 'comandos_robo', 'prompts_ia', 'planos_intervencao_ia',
            'relatorios_atendimento', 'saas_manutencoes_frota', 'contratos', 'salas_recursos',
            'recursos', 'help_desk_tickets', 'help_desk_mensagens', 'saas_integracoes_google'
        ]
    } else {
        tablesToBackup = tablesData.map((t: any) => t.table_name)
    }

    // 2. Read Migrations SQL Files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    let migrations: { name: string, content: string }[] = []

    try {
        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
            migrations = files.map(file => ({
                name: file,
                content: fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
            }))
        }
    } catch (e) {
        console.error('Erro ao ler migrações:', e)
    }

    // 3. Fetch ALL data from ALL tables dynamically
    const backupDatos: Record<string, any[]> = {}
    
    // Process tables in chunks or parallel (using Promise.all for speed)
    await Promise.all(tablesToBackup.map(async (table) => {
        try {
            const { data, error } = await adminClient.from(table).select('*')
            if (error) {
                console.error(`Erro ao fazer backup da tabela ${table}:`, error.message)
                backupDatos[table] = [] // Record failure but continue
            } else {
                backupDatos[table] = data || []
            }
        } catch (e) {
            console.error(`Erro fatal na tabela ${table}:`, e)
            backupDatos[table] = []
        }
    }))

    const backupData = {
        timestamp: new Date().toISOString(),
        type: 'DYNAMIC_FULL_SYSTEM_BACKUP',
        version: '1.13.1',
        total_tables: tablesToBackup.length,
        schema_migrations: migrations,
        datos: backupDatos
    }

    return { data: backupData }
}
