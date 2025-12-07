'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { differenceInYears, parseISO } from 'date-fns'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function generateInterventionPlan(promptId: number, pacienteId: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // 1. Fetch Prompt
    const { data: promptData } = await supabase
        .from('prompts_ia')
        .select('*')
        .eq('id', promptId)
        .single()

    if (!promptData) return { success: false, error: 'Prompt não encontrado' }

    // 2. Fetch Patient Data
    const { data: paciente } = await supabase
        .from('pacientes')
        .select(`
            *,
            anamnese:pacientes_anamnese(*)
        `)
        .eq('id', pacienteId)
        .single()

    if (!paciente) return { success: false, error: 'Paciente não encontrado' }

    // 3. Fetch Last Sessions (last 3)
    const { data: ultimasSessoes } = await supabase
        .from('agendamentos')
        .select('data_hora_inicio, observacoes')
        .eq('id_paciente', pacienteId)
        .eq('status', 'realizado')
        .order('data_hora_inicio', { ascending: false })
        .limit(3)

    // 4. Fetch Resources and Rooms
    const { data: recursos } = await supabase.from('recursos').select('nome_item')
    const { data: salas } = await supabase.from('salas_recursos').select('nome')

    // 5. Fetch Therapist Data (Curriculum)
    const { data: terapeutaUser } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', user.id)
        .single()

    const { data: curriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle()

    // 6. Fetch Previous Plan (for objective continuity)
    const { data: ultimoPlano } = await supabase
        .from('planos_intervencao_ia')
        .select('plano_final')
        .eq('id_paciente', pacienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const objetivoPlano = ultimoPlano ? 'Conforme último plano de intervenção gerado.' : 'Não especificado (Primeiro plano).'

    // 6. Prepare Data for Replacement
    const idade = differenceInYears(new Date(), parseISO(paciente.data_nascimento))

    // Safely access anamnese data
    const anamneseData = Array.isArray(paciente.anamnese) ? paciente.anamnese[0] : paciente.anamnese

    const diagnostico = anamneseData?.diagnostico_principal || anamneseData?.historico_medico || 'Não informado'

    // Extract preferences from musicoterapia JSONB if available, otherwise generic text
    let preferencias = 'Não informado'
    if (anamneseData?.musicoterapia) {
        if (typeof anamneseData.musicoterapia === 'string') {
            preferencias = anamneseData.musicoterapia
        } else {
            preferencias = JSON.stringify(anamneseData.musicoterapia)
        }
    }

    const sensibilidades = anamneseData?.desenvolvimento_motor || 'Não informado' // Using available field as proxy

    const sessoesTexto = ultimasSessoes?.map(s =>
        `- ${new Date(s.data_hora_inicio).toLocaleDateString()}: ${s.observacoes || 'Sem observações'}`
    ).join('\n') || 'Nenhuma sessão anterior registrada.'

    const recursosTexto = recursos?.map(r => r.nome_item).join(', ') || 'Nenhum recurso cadastrado.'
    const salasTexto = salas?.map(s => s.nome).join(', ') || 'Nenhuma sala cadastrada.'

    // 7. Replace Placeholders
    let promptFinal = promptData.prompt_texto
        .replace(/{{NOME}}/g, paciente.nome)
        .replace(/{{IDADE}}/g, idade.toString())
        .replace(/{{DIAGNOSTICO}}/g, diagnostico)
        .replace(/{{DIAGNOSTICO_E_ANAMNESE}}/g, diagnostico)
        .replace(/{{PREFERENCIAS}}/g, preferencias)
        .replace(/{{SENSIBILIDADES}}/g, sensibilidades)
        .replace(/{{ULTIMAS_SESSOES}}/g, sessoesTexto)
        .replace(/{{RECURSOS_LISTA}}/g, recursosTexto)
        .replace(/{{SALAS_LISTA}}/g, salasTexto)
        .replace(/{{OBJETIVO_PRINCIPAL_PLANO}}/g, objetivoPlano)

        // Therapist Placeholders
        .replace(/{{TERAPEUTA_NOME}}/g, terapeutaUser?.nome_completo || 'Terapeuta')
        .replace(/{{TERAPEUTA_FORMACAO}}/g, curriculo?.formacao || 'Profissional de Saúde')
        .replace(/{{TERAPEUTA_TECNICAS_PREFERIDAS}}/g, curriculo?.tecnicas_preferidas || 'Não informado')
        .replace(/{{TERAPEUTA_RECURSOS_PREFERIDOS}}/g, curriculo?.recursos_preferidos || 'Não informado')
        .replace(/{{TERAPEUTA_ESTILO_CONDUCAO}}/g, curriculo?.estilo_conducao || 'Não informado')
        .replace(/{{TERAPEUTA_OBSERVACOES}}/g, curriculo?.observacoes_clinicas || 'Não informado')

    // 7. Call Gemini API
    try {
        const model = genAI.getGenerativeModel({ model: promptData.modelo_gemini || 'gemini-2.5-flash' })
        const result = await model.generateContent(promptFinal)
        const response = await result.response
        const text = response.text()

        return { success: true, plan: text, promptUsed: promptFinal }
    } catch (error: any) {
        console.error('Erro na API Gemini:', error)
        return { success: false, error: 'Erro ao gerar plano com IA: ' + error.message }
    }
}

export async function saveInterventionPlan(pacienteId: number, promptId: number, planoOriginal: string, planoFinal: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const { error } = await supabase
        .from('planos_intervencao_ia')
        .insert({
            id_paciente: pacienteId,
            id_prompt_ia: promptId,
            id_terapeuta: user.id,
            plano_original: planoOriginal,
            plano_final: planoFinal
        })

    if (error) {
        console.error('Erro ao salvar plano:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function generateSessionReport(promptId: number, pacienteId: number, relatoSessao: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // 1. Fetch Prompt
    const { data: promptData } = await supabase
        .from('prompts_ia')
        .select('*')
        .eq('id', promptId)
        .single()

    if (!promptData) return { success: false, error: 'Prompt não encontrado' }

    // 2. Fetch Patient Data
    const { data: paciente } = await supabase
        .from('pacientes')
        .select(`
            *,
            anamnese:pacientes_anamnese(*)
        `)
        .eq('id', pacienteId)
        .single()

    if (!paciente) return { success: false, error: 'Paciente não encontrado' }

    // 3. Fetch Previous Reports (last 3 finalized)
    const { data: ultimosRelatorios } = await supabase
        .from('relatorios_atendimento')
        .select('created_at, relatorio_gerado')
        .eq('id_paciente', pacienteId)
        .eq('status', 'finalizado')
        .order('created_at', { ascending: false })
        .limit(3)

    // 4. Fetch Therapist Data (Curriculum)
    const { data: terapeutaUser } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', user.id)
        .single()

    const { data: curriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle()

    // 5. Prepare Data
    const idade = differenceInYears(new Date(), parseISO(paciente.data_nascimento))
    const anamneseData = Array.isArray(paciente.anamnese) ? paciente.anamnese[0] : paciente.anamnese
    const diagnostico = anamneseData?.diagnostico_principal || anamneseData?.historico_medico || 'Não informado'

    const historicoRelatorios = ultimosRelatorios?.map(r =>
        `--- Relatório de ${new Date(r.created_at).toLocaleDateString()} ---\n${r.relatorio_gerado}`
    ).reverse().join('\n\n') || 'Nenhum relatório anterior.'

    // 6. Replace Placeholders
    const dataSessao = new Date().toLocaleDateString('pt-BR')
    const credencial = `${terapeutaUser?.nome_completo || 'Terapeuta'} - ${curriculo?.registro_profissional || ''}`

    // Fetch latest plan objective
    const { data: ultimoPlano } = await supabase
        .from('planos_intervencao_ia')
        .select('plano_final')
        .eq('id_paciente', pacienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const objetivoPlano = ultimoPlano ? 'Conforme último plano de intervenção gerado.' : 'Não especificado.'

    const ultimasSessoesResumo = ultimosRelatorios?.map(r =>
        `- ${new Date(r.created_at).toLocaleDateString()}: Sessão realizada.`
    ).join('\n') || 'Nenhuma sessão anterior.'

    let promptFinal = promptData.prompt_texto
        .replace(/{{NOME}}/g, paciente.nome)
        .replace(/{{IDADE}}/g, idade.toString())
        .replace(/{{DIAGNOSTICO}}/g, diagnostico)
        .replace(/{{DIAGNOSTICO_E_ANAMNESE}}/g, diagnostico)
        .replace(/{{RELATO_SESSAO}}/g, relatoSessao)
        .replace(/{{RELATO_LIVRE_TERAPEUTA}}/g, relatoSessao)
        .replace(/{{HISTORICO_RELATORIOS}}/g, historicoRelatorios)
        .replace(/{{DATA_SESSAO}}/g, dataSessao)
        .replace(/{{OBJETIVO_PRINCIPAL_PLANO}}/g, objetivoPlano)
        .replace(/{{ULTIMAS_SESSOES}}/g, ultimasSessoesResumo)

        // Therapist Placeholders
        .replace(/{{TERAPEUTA_NOME}}/g, terapeutaUser?.nome_completo || 'Terapeuta')
        .replace(/{{TERAPEUTA_FORMACAO}}/g, curriculo?.formacao || 'Profissional de Saúde')
        .replace(/{{TERAPEUTA_TECNICAS_PREFERIDAS}}/g, curriculo?.tecnicas_preferidas || 'Não informado')
        .replace(/{{TERAPEUTA_RECURSOS_PREFERIDOS}}/g, curriculo?.recursos_preferidos || 'Não informado')
        .replace(/{{TERAPEUTA_ESTILO_CONDUCAO}}/g, curriculo?.estilo_conducao || 'Não informado')
        .replace(/{{TERAPEUTA_OBSERVACOES}}/g, curriculo?.observacoes_clinicas || 'Não informado')
        .replace(/{{TERAPEUTA_CREDENCIAL_COM_REGISTRO}}/g, credencial)

    // 7. Call Gemini API
    try {
        const model = genAI.getGenerativeModel({ model: promptData.modelo_gemini || 'gemini-2.5-flash' })
        const result = await model.generateContent(promptFinal)
        const response = await result.response
        const text = response.text()

        return { success: true, report: text, promptUsed: promptFinal }
    } catch (error: any) {
        console.error('Erro na API Gemini:', error)
        return { success: false, error: 'Erro ao gerar relatório com IA: ' + error.message }
    }
}

export async function getPlanosIAByPaciente(pacienteId: number) {
    const supabase = await createClient()

    const { data: planos, error } = await supabase
        .from('planos_intervencao_ia')
        .select(`
            id,
            created_at,
            plano_final,
            prompt:prompts_ia(nome_prompt),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id_paciente', pacienteId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar planos IA:', JSON.stringify(error, null, 2))
        return []
    }

    return planos.map((p: any) => ({
        ...p,
        titulo: p.prompt?.nome_prompt || 'Plano Sem Título',
        modelo_ia: 'IA' // Default since column is missing
    }))
}
