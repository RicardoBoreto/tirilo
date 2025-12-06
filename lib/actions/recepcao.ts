'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SalaStatus = {
    id: number
    nome: string
    cor_identificacao: string
    foto_url: string | null
    status: 'livre' | 'ocupada'
    ocupante_atual?: {
        terapeuta: string
        paciente: string
        inicio: string
        fim: string
    }
    proximo_horario?: string
}

export async function getStatusSalas() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return []

    // 1. Get all active rooms
    const { data: salas } = await supabase
        .from('salas_recursos')
        .select('*')
        .eq('id_clinica', userProfile.id_clinica)
        .eq('ativa', true)
        .order('nome')

    if (!salas) return []

    // 2. Get current active appointments
    const now = new Date()
    const nowISO = now.toISOString()

    // We want appointments that started before now and end after now
    const { data: activeAppointments } = await supabase
        .from('agendamentos')
        .select(`
            id_sala,
            data_hora_inicio,
            data_hora_fim,
            terapeuta:usuarios(nome_completo),
            paciente:pacientes(nome)
        `)
        .eq('id_clinica', userProfile.id_clinica)
        .lte('data_hora_inicio', nowISO)
        .gte('data_hora_fim', nowISO)
        .not('id_sala', 'is', null)

    // Map appointments by room ID
    const appointmentMap = new Map()
    activeAppointments?.forEach((app: any) => {
        if (app.id_sala) {
            appointmentMap.set(app.id_sala, app)
        }
    })

    // 3. Build status
    const statusSalas: SalaStatus[] = salas.map(sala => {
        const activeApp = appointmentMap.get(sala.id)

        return {
            id: sala.id,
            nome: sala.nome,
            cor_identificacao: sala.cor_identificacao || '#3b82f6',
            foto_url: sala.foto_url,
            status: activeApp ? 'ocupada' : 'livre',
            ocupante_atual: activeApp ? {
                terapeuta: activeApp.terapeuta?.nome_completo || 'Terapeuta',
                paciente: activeApp.paciente?.nome || 'Paciente',
                inicio: activeApp.data_hora_inicio,
                fim: activeApp.data_hora_fim
            } : undefined
        }
    })

    return statusSalas
}
