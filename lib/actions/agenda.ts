'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { insertGoogleEvent, updateGoogleEvent, deleteGoogleEvent, mapAgendamentoToGoogleEvent } from '@/lib/google'

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
    google_event_id?: string
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

    const { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert(appointmentsToInsert)
        .select(`
            *,
            paciente:pacientes(nome)
        `)

    if (error) {
        console.error('Erro ao criar agendamento(s):', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return { success: false, error: error.message }
    }

    // Sync with Google Calendar
    if (insertedData) {
        for (const agendamento of insertedData) {
            const eventData = mapAgendamentoToGoogleEvent(agendamento)
            const googleEvent = await insertGoogleEvent(user.id, eventData)

            if (googleEvent && googleEvent.id) {
                await supabase
                    .from('agendamentos')
                    .update({ google_event_id: googleEvent.id })
                    .eq('id', agendamento.id)
            }
        }
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

    const { data: updatedData, error } = await supabase
        .from('agendamentos')
        .update(agendamentoData)
        .eq('id', id)
        .select(`
            *,
            paciente:pacientes(nome)
        `)
        .single()

    if (error) {
        console.error('Erro ao atualizar agendamento:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return { success: false, error: error.message }
    }

    // Update in Google Calendar
    if (updatedData && updatedData.google_event_id) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const eventData = mapAgendamentoToGoogleEvent(updatedData)
            await updateGoogleEvent(user.id, updatedData.google_event_id, eventData)
        }
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

        const { data: deletedData, error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id_paciente', target.id_paciente)
            .eq('id_terapeuta', user.id) // Ensure we only delete ours
            .gte('data_hora_inicio', target.data_hora_inicio)
            .select('google_event_id')

        if (error) {
            console.error('Erro ao excluir agendamentos futuros:', error)
            return { success: false, error: error.message }
        }

        if (deletedData) {
            for (const item of deletedData) {
                if (item.google_event_id) {
                    await deleteGoogleEvent(user.id, item.google_event_id)
                }
            }
        }

    } else {
        // Delete single
        const { data: existing } = await supabase
            .from('agendamentos')
            .select('google_event_id')
            .eq('id', id)
            .single()

        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id)
            .eq('id_terapeuta', user.id) // Safety check

        if (!error && existing?.google_event_id) {
            await deleteGoogleEvent(user.id, existing.google_event_id)
        }

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

    return data.map((item: any) => item.paciente)
}
