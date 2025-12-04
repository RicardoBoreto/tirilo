'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveRelatorio(data: {
    id_agendamento: number
    id_paciente: number
    texto_bruto: string
    relatorio_gerado: string
    id_prompt_ia: number | null
    status: 'rascunho' | 'finalizado'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return { success: false, error: 'Clínica não encontrada' }

    // Check if exists to update or insert
    const { data: existing } = await supabase
        .from('relatorios_atendimento')
        .select('id')
        .eq('id_agendamento', data.id_agendamento)
        .single()

    let error;

    if (existing) {
        const { error: updateError } = await supabase
            .from('relatorios_atendimento')
            .update({
                texto_bruto: data.texto_bruto,
                relatorio_gerado: data.relatorio_gerado,
                id_prompt_ia: data.id_prompt_ia,
                status: data.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('relatorios_atendimento')
            .insert({
                ...data,
                id_terapeuta: user.id,
                id_clinica: userProfile.id_clinica
            })
        error = insertError
    }

    if (error) {
        console.error('Erro ao salvar relatório:', error)
        return { success: false, error: error.message }
    }

    // If finalized, update agendamento status to 'realizado'
    if (data.status === 'finalizado') {
        await supabase
            .from('agendamentos')
            .update({ status: 'realizado' })
            .eq('id', data.id_agendamento)
    }

    revalidatePath('/admin/agenda')
    return { success: true }
}

export async function getRelatorioByAgendamento(agendamentoId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('relatorios_atendimento')
        .select('*')
        .eq('id_agendamento', agendamentoId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar relatório:', error)
        return null
    }

    return data
}

export async function getRelatoriosByPaciente(pacienteId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('relatorios_atendimento')
        .select(`
            *,
            terapeuta:usuarios(nome_completo),
            agendamento:agendamentos(data_hora_inicio)
        `)
        .eq('id_paciente', pacienteId)

    if (error) {
        console.error('Erro ao buscar relatórios do paciente:', error)
        return []
    }

    // Sort by session date descending (most recent first)
    return data.sort((a, b) => {
        const dateA = new Date(a.agendamento?.data_hora_inicio || a.created_at).getTime()
        const dateB = new Date(b.agendamento?.data_hora_inicio || b.created_at).getTime()
        return dateB - dateA
    })
}
