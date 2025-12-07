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
        { data: clinicas },
        { data: usuarios },
        { data: terapeutas_curriculo },
        { data: responsaveis },
        { data: pacientes },
        { data: pacientes_terapeutas },
        { data: anamnese },
        { data: salas },
        { data: agendamentos },
        { data: relatorios },
        { data: promts_ia },
        { data: planos_ia },
        { data: help_desk_tickets },
        { data: help_desk_mensagens },
        { data: materiais }
    ] = await Promise.all([
        supabase.from('saas_clinicas').select('*'),
        supabase.from('usuarios').select('*'),
        supabase.from('terapeutas_curriculo').select('*'),
        supabase.from('responsaveis').select('*'),
        supabase.from('pacientes').select('*'),
        supabase.from('pacientes_terapeutas').select('*'),
        supabase.from('anamnese').select('*'),
        supabase.from('salas').select('*'),
        supabase.from('agendamentos').select('*'),
        supabase.from('relatorios').select('*'),
        supabase.from('prompts_ia').select('*'),
        supabase.from('planos_ia').select('*'),
        supabase.from('help_desk_tickets').select('*'),
        supabase.from('help_desk_mensagens').select('*'),
        supabase.from('materiais').select('*')
    ])

    const backupData = {
        timestamp: new Date().toISOString(),
        type: 'FULL_SYSTEM_BACKUP',
        schema_migrations: migrations,
        datos: {
            saas_clinicas: clinicas,
            usuarios,
            terapeutas_curriculo,
            responsaveis,
            pacientes,
            pacientes_terapeutas,
            anamnese,
            salas,
            agendamentos,
            relatorios,
            promts_ia,
            planos_ia,
            help_desk_tickets,
            help_desk_mensagens,
            materiais
        }
    }

    return { data: backupData }
}
