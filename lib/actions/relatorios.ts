'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_MODEL_VERSION } from '@/lib/constants/ai_models'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
export async function extractRelatorioFromImage(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('Arquivo não fornecido')

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_VERSION })

    const prompt = `Analise esta imagem de um relatório de atendimento ou evolução clínica.
    Extraia a DATA da sessão e o TEXTO do relato.
    Retorne um JSON estritamente válido:
    {
        "data_sessao": "YYYY-MM-DD" (se não encontrar, null com formato YYYY-MM-DD),
        "resumo": "Texto completo do relatório corrigido e formatado."
    }`

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])
        const response = await result.response
        const text = response.text()
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(cleanText)
    } catch (e: any) {
        console.error('Erro na extração IA:', e)
        throw new Error('Falha ao processar imagem: ' + e.message)
    }
}

export async function importarRelatorioLegado(data: {
    pacienteId: number
    dataSessao: string
    texto: string
    arquivoUrl?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) throw new Error('Clínica não encontrada')

    // 1. Criar Agendamento Retroativo
    // Assumimos horário comercial padrão 08:00 se não especificado, duração 1h
    const dataHoraInicio = `${data.dataSessao}T08:00:00`
    const dataHoraFim = `${data.dataSessao}T09:00:00`

    const { data: agendamento, error: agendaError } = await supabase
        .from('agendamentos')
        .insert({
            id_paciente: data.pacienteId,
            id_terapeuta: user.id,
            id_clinica: userProfile.id_clinica,
            data_hora_inicio: dataHoraInicio,
            data_hora_fim: dataHoraFim,
            status: 'realizado',
            observacoes: 'Atendimento importado do histórico legado',
            tipo_sessao: 'Histórico'
        })
        .select()
        .single()

    if (agendaError) {
        console.error('Erro ao criar agendamento histórico:', agendaError)
        throw new Error('Erro ao criar registro de agendamento')
    }

    // 2. Criar Relatório vinculado
    const { error: relError } = await supabase
        .from('relatorios_atendimento')
        .insert({
            id_agendamento: agendamento.id,
            id_paciente: data.pacienteId,
            id_terapeuta: user.id,
            id_clinica: userProfile.id_clinica,
            texto_bruto: '', // IA não gera bruto, gera formatado
            relatorio_gerado: data.texto,
            status: 'finalizado',
            id_prompt_ia: null
        })

    if (relError) {
        console.error('Erro ao criar relatório:', relError)
        throw new Error('Erro ao salvar texto do relatório')
    }

    revalidatePath(`/admin/pacientes/${data.pacienteId}`)
    return { success: true }
}

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

    // If finalized, update agendamento status to 'concluido'
    if (data.status === 'finalizado') {
        await supabase
            .from('agendamentos')
            .update({ status: 'concluido' })
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
        // Ordenação inicial no banco pelo created_at como fallback
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar relatórios do paciente:', error)
        return []
    }

    // Ordenação robusta por data da sessão (prioridade) ou criação
    return data.sort((a, b) => {
        const getDate = (item: any) => {
            // Tenta pegar data do agendamento
            if (item.agendamento?.data_hora_inicio) {
                return new Date(item.agendamento.data_hora_inicio).getTime()
            }
            // Fallback para data de cadastro
            return new Date(item.created_at).getTime()
        }

        const dateA = getDate(a)
        const dateB = getDate(b)

        // Decrescente (mais novo primeiro)
        return dateB - dateA
    })
}

export async function deleteRelatorio(id: number, pacienteId: number) {
    const supabase = await createClient()

    const { data: relatorio } = await supabase
        .from('relatorios_atendimento')
        .select('*, agendamento:agendamentos(id, tipo_sessao)')
        .eq('id', id)
        .single()

    if (!relatorio) return { success: false, error: 'Relatório não encontrado' }

    const { error } = await supabase
        .from('relatorios_atendimento')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar relatório:', error)
        return { success: false, error: 'Falha ao excluir relatório' }
    }

    // Se for agendamento histórico, limpa o registro na agenda também
    if (relatorio.agendamento && relatorio.agendamento.tipo_sessao === 'Histórico') {
        await supabase
            .from('agendamentos')
            .delete()
            .eq('id', relatorio.agendamento.id)
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
    return { success: true }
}

export async function toggleVisibilidadeRelatorio(id: number, visivel: boolean) {
    const supabase = await createClient()

    // Get pacienteId for revalidation
    const { data: relatorio } = await supabase
        .from('relatorios_atendimento')
        .select('id_paciente')
        .eq('id', id)
        .single()

    const { error } = await supabase
        .from('relatorios_atendimento')
        .update({ visivel_familia: visivel })
        .eq('id', id)

    if (error) throw new Error('Erro ao atualizar visibilidade')

    if (relatorio) {
        revalidatePath(`/admin/pacientes/${relatorio.id_paciente}`)
    }
    return { success: true }
}
