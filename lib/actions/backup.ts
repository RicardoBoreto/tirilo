'use server'

import { createClient } from '@/lib/supabase/server'

import fs from 'fs'
import path from 'path'

export async function generateBackup() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    // Fetch user profile to get clinic_id
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    if (userProfile?.id_clinica) {
        return { error: 'Acesso negado. Apenas o administrador do SaaS pode realizar o backup completo do sistema.' }
    }

    // Read Migrations
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
        // Continue without migrations if fails
    }

    // Master User - Fetch ALL data
    const [
        { data: saas_clinicas },
        { data: usuarios },
        { data: terapeutas_curriculo },
        { data: responsaveis },
        { data: pacientes },
        { data: pacientes_responsaveis },
        { data: pacientes_terapeutas },
        { data: pacientes_anamnese },
        { data: salas_recursos },
        { data: agendamentos },
        { data: relatorios_atendimento },
        { data: prompts_ia },
        { data: planos_intervencao_ia },
        { data: help_desk_tickets },
        { data: help_desk_mensagens },
        { data: recursos },
        // Games & Monetization
        { data: saas_jogos },
        { data: saas_jogos_versoes },
        { data: saas_clinicas_jogos },
        // Robotics
        { data: saas_frota_robos },
        { data: saas_manutencoes_frota },
        { data: clinica_config_ia },
        { data: comandos_robo },
        { data: sessao_telemetria },
        // Financial (if any new tables were added recently like categories or accounts receivable, add here if they exist in schema)
        // Checking TABELAS.sql... 'financeiro_categorias', 'financeiro_lancamentos', 'contratos'
        { data: financeiro_categorias },
        { data: financeiro_lancamentos },
        { data: contratos }
    ] = await Promise.all([
        supabase.from('saas_clinicas').select('*'),
        supabase.from('usuarios').select('*'),
        supabase.from('terapeutas_curriculo').select('*'),
        supabase.from('responsaveis').select('*'),
        supabase.from('pacientes').select('*'),
        supabase.from('pacientes_responsaveis').select('*'),
        supabase.from('pacientes_terapeutas').select('*'),
        supabase.from('pacientes_anamnese').select('*'),
        supabase.from('salas_recursos').select('*'),
        supabase.from('agendamentos').select('*'),
        supabase.from('relatorios_atendimento').select('*'),
        supabase.from('prompts_ia').select('*'),
        supabase.from('planos_intervencao_ia').select('*'),
        supabase.from('help_desk_tickets').select('*'),
        supabase.from('help_desk_mensagens').select('*'),
        supabase.from('recursos').select('*'),

        supabase.from('saas_jogos').select('*'),
        supabase.from('saas_jogos_versoes').select('*'),
        supabase.from('saas_clinicas_jogos').select('*'),

        supabase.from('saas_frota_robos').select('*'),
        supabase.from('saas_manutencoes_frota').select('*'),
        supabase.from('clinica_config_ia').select('*'),
        supabase.from('comandos_robo').select('*'),
        supabase.from('sessao_telemetria').select('*'),

        supabase.from('financeiro_categorias').select('*'),
        supabase.from('financeiro_lancamentos').select('*'),
        supabase.from('contratos').select('*')
    ])

    const backupData = {
        timestamp: new Date().toISOString(),
        type: 'FULL_SYSTEM_BACKUP',
        schema_migrations: migrations,
        datos: {
            saas_clinicas,
            usuarios,
            terapeutas_curriculo,
            responsaveis,
            pacientes,
            pacientes_responsaveis,
            pacientes_terapeutas,
            pacientes_anamnese,
            salas_recursos,
            agendamentos,
            relatorios_atendimento,
            prompts_ia,
            planos_intervencao_ia,
            help_desk_tickets,
            help_desk_mensagens,
            recursos,

            // New Modules
            saas_jogos,
            saas_jogos_versoes,
            saas_clinicas_jogos,
            saas_frota_robos,
            saas_manutencoes_frota,
            clinica_config_ia,
            comandos_robo,
            sessao_telemetria,
            financeiro_categorias,
            financeiro_lancamentos,
            contratos
        }
    }

    return { data: backupData }
}
