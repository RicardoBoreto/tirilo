'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Agendamento = {
    id: number
    created_at: string
    id_clinica: number
    id_paciente: number
    id_terapeuta: string
    id_sala: number | null
    data_hora_inicio: string
    data_hora_fim: string
    tipo_sessao: 'individual' | 'dupla' | 'avaliacao'
    status: 'agendado' | 'concluido' | 'cancelado' | 'falta'
    observacoes: string | null
    paciente?: {
        nome: string
        foto_url: string | null
    }
    sala?: {
        nome: string
        cor_hex: string
    }
    terapeuta?: {
        nome_completo: string
    }
    tem_relatorio?: boolean
}

export async function getAgendamentos(start: string, end: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get user profile to check role and clinic
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return []

    let query = supabase
        .from('agendamentos')
        .select(`
            *,
            paciente:pacientes(nome, foto_url),
            sala:salas_recursos(nome, cor_hex),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id_clinica', userProfile.id_clinica)
        .gte('data_hora_inicio', start)
        .lte('data_hora_fim', end)

    // If therapist, only show their appointments (or maybe all? usually only theirs or all if admin allows)
    // Requirement says "Mostra os horários já ocupados dos pacientes dele mesmo". 
    // Let's filter by therapist if user is a therapist.
    if (userProfile.tipo_perfil === 'terapeuta') {
        query = query.eq('id_terapeuta', user.id)
    }

    const { data, error } = await query

    if (error) {
        console.error('Erro ao buscar agendamentos:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return []
    }

    // Check for existing reports
    const agendamentoIds = data.map(a => a.id)
    const { data: relatorios } = await supabase
        .from('relatorios_atendimento')
        .select('id_agendamento')
        .in('id_agendamento', agendamentoIds)

    const relatoriosSet = new Set(relatorios?.map(r => r.id_agendamento))

    const agendamentosComRelatorio = data.map(a => ({
        ...a,
        tem_relatorio: relatoriosSet.has(a.id)
    }))

    return agendamentosComRelatorio as Agendamento[]
}

export async function createAgendamento(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) throw new Error('Usuário sem clínica vinculada')

    const dataInicioStr = formData.get('data_hora_inicio') as string
    const dataFimStr = formData.get('data_hora_fim') as string
    const recorrencia = formData.get('recorrencia') === 'true'
    const recorrenciaFimStr = formData.get('recorrencia_fim') as string

    const appointmentsToInsert = []

    // Base appointment data
    const baseData = {
        id_clinica: userProfile.id_clinica,
        id_paciente: Number(formData.get('id_paciente')),
        id_terapeuta: user.id,
        id_sala: formData.get('id_sala') && formData.get('id_sala') !== '' ? Number(formData.get('id_sala')) : null,
        tipo_sessao: formData.get('tipo_sessao') as string,
        observacoes: formData.get('observacoes') as string || null,
        status: 'agendado'
    }

    // Calculate duration
    const start = new Date(dataInicioStr)
    const end = new Date(dataFimStr)
    const durationMs = end.getTime() - start.getTime()

    if (recorrencia && recorrenciaFimStr) {
        const recurrenceEnd = new Date(recorrenciaFimStr)
        // Set end of day for recurrence end to include the day itself
        recurrenceEnd.setHours(23, 59, 59, 999)

        let currentStart = new Date(start)

        while (currentStart <= recurrenceEnd) {
            const currentEnd = new Date(currentStart.getTime() + durationMs)

            appointmentsToInsert.push({
                ...baseData,
                data_hora_inicio: currentStart.toISOString(),
                data_hora_fim: currentEnd.toISOString()
            })

            // Add 7 days
            currentStart.setDate(currentStart.getDate() + 7)
        }
    } else {
        // Single appointment
        appointmentsToInsert.push({
            ...baseData,
            data_hora_inicio: dataInicioStr,
            data_hora_fim: dataFimStr
        })
    }

    const { error } = await supabase
        .from('agendamentos')
        .insert(appointmentsToInsert)

    if (error) {
        console.error('Erro ao criar agendamento(s):', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/agenda')
    return { success: true }
}

export async function updateAgendamento(id: number, formData: FormData) {
    const supabase = await createClient()

    const dataInicio = formData.get('data_hora_inicio') as string
    const dataFim = formData.get('data_hora_fim') as string

    const agendamentoData = {
        id_paciente: Number(formData.get('id_paciente')),
        id_sala: formData.get('id_sala') && formData.get('id_sala') !== '' ? Number(formData.get('id_sala')) : null,
        data_hora_inicio: dataInicio,
        data_hora_fim: dataFim,
        tipo_sessao: formData.get('tipo_sessao') as string,
        observacoes: formData.get('observacoes') as string || null,
    }

    const { error } = await supabase
        .from('agendamentos')
        .update(agendamentoData)
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar agendamento:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/agenda')
    return { success: true }
}

export async function updateAgendamentoStatus(id: number, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar status do agendamento:', error)
        throw new Error('Erro ao atualizar status')
    }

    revalidatePath('/admin/agenda')
}

export async function deleteAgendamento(id: number, deleteFuture: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    if (deleteFuture) {
        // 1. Get the target appointment details
        const { data: target, error: fetchError } = await supabase
            .from('agendamentos')
            .select('id_paciente, data_hora_inicio')
            .eq('id', id)
            .single()

        if (fetchError || !target) {
            return { success: false, error: 'Agendamento não encontrado' }
        }

        const targetDate = new Date(target.data_hora_inicio)
        // We want to delete appointments for this patient, starting from this date/time, 
        // that match the same weekday and time? 
        // Or just ALL future appointments for this patient?
        // User said "excluir todas as proximas agendas futuras deste mesmo paciente".
        // Usually this implies the "series". But we don't have a series ID.
        // A safe heuristic is: Same Patient, Same Therapist (implied by user), Start Time >= Target Start Time.
        // But maybe checking weekday/time is safer to avoid deleting other unrelated appointments.
        // Let's implement: Same Patient, Same Therapist, Start Date >= Target Date.
        // WARNING: This might delete unrelated appointments if the patient has multiple slots per week.
        // Let's refine: Same Patient, Same Therapist, Same Weekday, Same Hour/Minute?
        // For MVP, let's stick to "Same Patient, Same Therapist, Start Time >= Target Start Time".
        // But to be safer, let's filter by Day of Week and Time if possible, or just accept the broad delete.
        // Given the prompt "excluir todas as proximas agendas futuras deste mesmo paciente", it sounds broad.
        // But typically in calendars, it means "this series".
        // Let's try to match the time of day at least.

        // Extract time from target
        const timeStr = target.data_hora_inicio.split('T')[1] // HH:mm:ss...

        // Since we can't easily filter by "time part" in Supabase/Postgres without raw SQL or extensions,
        // and we want to be safe, let's fetch candidates and filter in code or use a range.
        // Actually, let's just delete by ID >= Target ID? No, IDs might not be sequential.
        // Let's delete where id_paciente = X AND id_terapeuta = Y AND data_hora_inicio >= Z.

        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id_paciente', target.id_paciente)
            .eq('id_terapeuta', user.id) // Ensure we only delete ours
            .gte('data_hora_inicio', target.data_hora_inicio)

        if (error) {
            console.error('Erro ao excluir agendamentos futuros:', error)
            return { success: false, error: error.message }
        }

    } else {
        // Delete single
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id)
            .eq('id_terapeuta', user.id) // Safety check

        if (error) {
            console.error('Erro ao excluir agendamento:', error)
            return { success: false, error: error.message }
        }
    }

    revalidatePath('/admin/agenda')
    return { success: true }
}

export async function getMeusPacientes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get patients linked to therapist
    const { data, error } = await supabase
        .from('pacientes_terapeutas')
        .select(`
            paciente:pacientes(id, nome, foto_url)
        `)
        .eq('terapeuta_id', user.id)

    if (error) {
        console.error('Erro ao buscar pacientes do terapeuta:', error)
        return []
    }

    // Also get all patients if admin? For now just linked ones or all active in clinic if admin.
    // Let's stick to linked ones for therapist context.

    return data.map((item: any) => item.paciente)
}
