'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { differenceInYears, parseISO } from 'date-fns'
import { GEMINI_MODEL_VERSION } from '@/lib/constants/ai_models'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// --- Anonymization Helpers ---
function anonymize(text: string, map: Record<string, string>) {
    if (!text) return text
    let result = text
    // Order by length descending to replace longer names first (e.g. "Ana Maria" before "Ana")
    const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length)

    for (const real of sortedKeys) {
        if (!real || real.length < 3) continue // Skip very short names to avoid false positives
        const fake = map[real]
        // Case insensitive global replacement escaping special chars
        const escaped = real.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi') // Word boundaries for safety
        result = result.replace(regex, fake)

        // Also try without word boundaries for partial matches if needed, but word boundary is safer for names
        // Fallback: replace just the string if word boundary fails involved with punctuation
        const regexSimple = new RegExp(escaped, 'gi')
        result = result.replace(regexSimple, fake)
    }
    return result
}

function deanonymize(text: string, map: Record<string, string>) {
    if (!text) return text
    let result = text
    const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length)

    for (const real of sortedKeys) {
        const fake = map[real]
        const escaped = fake.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escaped, 'gi')
        result = result.replace(regex, real)
    }
    return result
}

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
        .select('nome_completo, id_clinica')
        .eq('id', user.id)
        .single()

    const { data: curriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle()

    // --- LUDOTERAPIA DATA ---
    const jogosDisponiveis = await getJogosDisponiveisTexto(supabase, terapeutaUser?.id_clinica)
    const historicoLudico = await getHistoricoLudicoTexto(supabase, pacienteId)
    // ------------------------

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

    // --- ANONYMIZATION SETUP ---
    const realPatientName = paciente.nome
    const realTherapistName = terapeutaUser?.nome_completo || 'Terapeuta'

    // Split names to anonymize first names too check length to avoid replacing short words like "Ana" inappropriately if logic was simpler, but "Horace" is safe.
    const realPatientFirst = realPatientName.split(' ')[0]
    const realTherapistFirst = realTherapistName.split(' ')[0]

    const anonymizationMap: Record<string, string> = {
        [realPatientName]: 'HORACE',
        [realTherapistName]: 'SAM',
    }
    // Add first names if they are distinct and long enough to be safe, or just force them
    if (realPatientFirst.length > 2) anonymizationMap[realPatientFirst] = 'HORACE'
    if (realTherapistFirst.length > 2 && realTherapistFirst !== realPatientFirst) anonymizationMap[realTherapistFirst] = 'SAM'

    // --- ANONYMIZE DATA FIELDS ---
    // We must anonymize ALL free-text fields that might contain the real names
    const anonDiagnostico = anonymize(diagnostico, anonymizationMap)
    const anonPreferencias = anonymize(preferencias, anonymizationMap)
    const anonSensibilidades = anonymize(sensibilidades, anonymizationMap)
    const anonSessoesTexto = anonymize(sessoesTexto, anonymizationMap)
    const anonObjetivoPlano = anonymize(objetivoPlano, anonymizationMap)
    const anonJogosDisponiveis = anonymize(jogosDisponiveis, anonymizationMap)
    const anonHistoricoLudico = anonymize(historicoLudico, anonymizationMap)

    const anonTerapeutaFormacao = anonymize(curriculo?.formacao || 'Profissional de Saúde', anonymizationMap)
    const anonTerapeutaTecnicas = anonymize(curriculo?.tecnicas_preferidas || 'Não informado', anonymizationMap)
    const anonTerapeutaRecursos = anonymize(curriculo?.recursos_preferidos || 'Não informado', anonymizationMap)
    const anonTerapeutaEstilo = anonymize(curriculo?.estilo_conducao || 'Não informado', anonymizationMap)
    const anonTerapeutaObs = anonymize(curriculo?.observacoes_clinicas || 'Não informado', anonymizationMap)

    // 7. Replace Placeholders with ANONYMIZED Data
    let promptFinal = promptData.prompt_texto
        // Direct Name Replacements with CODENAMES
        .replace(/{{NOME}}/g, 'HORACE')
        .replace(/{{IDADE}}/g, idade.toString())
        .replace(/{{DIAGNOSTICO}}/g, anonDiagnostico)
        .replace(/{{DIAGNOSTICO_E_ANAMNESE}}/g, anonDiagnostico)
        .replace(/{{PREFERENCIAS}}/g, anonPreferencias)
        .replace(/{{SENSIBILIDADES}}/g, anonSensibilidades)
        .replace(/{{ULTIMAS_SESSOES}}/g, anonSessoesTexto)
        .replace(/{{RECURSOS_LISTA}}/g, recursosTexto) // Resources usually don't have PII
        .replace(/{{SALAS_LISTA}}/g, salasTexto) // Rooms usually don't have PII
        .replace(/{{OBJETIVO_PRINCIPAL_PLANO}}/g, anonObjetivoPlano)

        // Ludoterapia
        .replace(/{{JOGOS_DISPONIVEIS}}/g, anonJogosDisponiveis)
        .replace(/{{HISTORICO_LUDICO}}/g, anonHistoricoLudico)

        // Therapist Placeholders with CODENAMES
        .replace(/{{TERAPEUTA_NOME}}/g, 'SAM')
        .replace(/{{TERAPEUTA_FORMACAO}}/g, anonTerapeutaFormacao)
        .replace(/{{TERAPEUTA_TECNICAS_PREFERIDAS}}/g, anonTerapeutaTecnicas)
        .replace(/{{TERAPEUTA_RECURSOS_PREFERIDOS}}/g, anonTerapeutaRecursos)
        .replace(/{{TERAPEUTA_ESTILO_CONDUCAO}}/g, anonTerapeutaEstilo)
        .replace(/{{TERAPEUTA_OBSERVACOES}}/g, anonTerapeutaObs)

    // 7. Call Gemini API
    try {
        const model = genAI.getGenerativeModel({ model: promptData.modelo_gemini || GEMINI_MODEL_VERSION })
        const result = await model.generateContent(promptFinal)
        const response = await result.response
        const text = response.text()

        // --- DEANONYMIZE RESPONSE ---
        const finalText = deanonymize(text, anonymizationMap)

        return { success: true, plan: finalText, promptUsed: promptFinal }
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

export async function generateSessionReport(promptId: number, pacienteId: number, relatoSessao: string, dataSessaoIso?: string) {
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
        .order('created_at', { ascending: false })
        .limit(3)

    // 3b. Fetch Previous Plans (last 2)
    const { data: ultimosPlanos } = await supabase
        .from('planos_intervencao_ia')
        .select('created_at, plano_final, titulo')
        .eq('id_paciente', pacienteId)
        .order('created_at', { ascending: false })
        .limit(2)

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

    const historicoPlanos = ultimosPlanos?.map(p =>
        `--- Plano (${p.titulo || 'Plano IA'}) de ${new Date(p.created_at).toLocaleDateString()} ---\n${p.plano_final}`
    ).join('\n\n') || 'Nenhum plano anterior.'

    // --- LUDOTERAPIA: DIARIO ---
    const diarioSessao = await getDiarioSessaoTexto(supabase, pacienteId)
    // ---------------------------

    const dataObj = dataSessaoIso ? new Date(dataSessaoIso) : new Date()
    const dataSessao = dataObj.toLocaleDateString('pt-BR')
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

    // --- ANONYMIZATION SETUP ---
    const realPatientName = paciente.nome
    const realTherapistName = terapeutaUser?.nome_completo || 'Terapeuta'

    const realPatientFirst = realPatientName.split(' ')[0]
    const realTherapistFirst = realTherapistName.split(' ')[0]

    const anonymizationMap: Record<string, string> = {
        [realPatientName]: 'HORACE',
        [realTherapistName]: 'SAM',
    }
    if (realPatientFirst.length > 2) anonymizationMap[realPatientFirst] = 'HORACE'
    if (realTherapistFirst.length > 2 && realTherapistFirst !== realPatientFirst) anonymizationMap[realTherapistFirst] = 'SAM'

    // --- ANONYMIZE FIELDS ---
    const anonDiagnostico = anonymize(diagnostico, anonymizationMap)
    const anonRelatoSessao = anonymize(relatoSessao, anonymizationMap)
    const anonHistoricoRelatorios = anonymize(historicoRelatorios, anonymizationMap)
    const anonHistoricoPlanos = anonymize(historicoPlanos, anonymizationMap)
    const anonDiarioSessao = anonymize(diarioSessao, anonymizationMap)
    const anonObjetivoPlano = anonymize(objetivoPlano, anonymizationMap)
    const anonUltimasSessoes = anonymize(ultimasSessoesResumo, anonymizationMap)

    const anonTerapeutaFormacao = anonymize(curriculo?.formacao || 'Profissional de Saúde', anonymizationMap)
    const anonTerapeutaTecnicas = anonymize(curriculo?.tecnicas_preferidas || 'Não informado', anonymizationMap)
    const anonTerapeutaRecursos = anonymize(curriculo?.recursos_preferidos || 'Não informado', anonymizationMap)
    const anonTerapeutaEstilo = anonymize(curriculo?.estilo_conducao || 'Não informado', anonymizationMap)
    const anonTerapeutaObs = anonymize(curriculo?.observacoes_clinicas || 'Não informado', anonymizationMap)
    const anonCredencial = anonymize(credencial, anonymizationMap)

    // 6. Replace Placeholders
    let promptFinal = promptData.prompt_texto
        .replace(/{{NOME}}/g, 'HORACE')
        .replace(/{{IDADE}}/g, idade.toString())
        .replace(/{{DIAGNOSTICO}}/g, anonDiagnostico)
        .replace(/{{DIAGNOSTICO_E_ANAMNESE}}/g, anonDiagnostico)
        .replace(/{{RELATO_SESSAO}}/g, anonRelatoSessao)
        .replace(/{{RELATO_LIVRE_TERAPEUTA}}/g, anonRelatoSessao)
        .replace(/{{HISTORICO_RELATORIOS}}/g, anonHistoricoRelatorios)
        .replace(/{{HISTORICO_PLANOS}}/g, anonHistoricoPlanos)
        .replace(/{{DATA_SESSAO}}/g, dataSessao)
        .replace(/{{OBJETIVO_PRINCIPAL_PLANO}}/g, anonObjetivoPlano)
        .replace(/{{ULTIMAS_SESSOES}}/g, anonUltimasSessoes)

        // Ludoterapia
        .replace(/{{DIARIO_SESSAO}}/g, anonDiarioSessao)

        // Therapist Placeholders
        .replace(/{{TERAPEUTA_NOME}}/g, 'SAM')
        .replace(/{{TERAPEUTA_FORMACAO}}/g, anonTerapeutaFormacao)
        .replace(/{{TERAPEUTA_TECNICAS_PREFERIDAS}}/g, anonTerapeutaTecnicas)
        .replace(/{{TERAPEUTA_RECURSOS_PREFERIDOS}}/g, anonTerapeutaRecursos)
        .replace(/{{TERAPEUTA_ESTILO_CONDUCAO}}/g, anonTerapeutaEstilo)
        .replace(/{{TERAPEUTA_OBSERVACOES}}/g, anonTerapeutaObs)
        .replace(/{{TERAPEUTA_CREDENCIAL_COM_REGISTRO}}/g, anonCredencial)

    // 7. Call Gemini API
    try {
        const model = genAI.getGenerativeModel({ model: promptData.modelo_gemini || GEMINI_MODEL_VERSION })
        const result = await model.generateContent(promptFinal)
        const response = await result.response
        const text = response.text()

        // --- DEANONYMIZE RESPONSE ---
        const finalText = deanonymize(text, anonymizationMap)

        return { success: true, report: finalText, promptUsed: promptFinal }
    } catch (error: any) {
        console.error('Erro na API Gemini:', error)
        return { success: false, error: 'Erro ao gerar relatório com IA: ' + error.message }
    }
}

export async function getPlanosIAByPaciente(pacienteId: number) {
    const supabase = await createClient()

    // Tentar selecionar com a coluna 'titulo' (nova)
    let { data: planos, error } = await supabase
        .from('planos_intervencao_ia')
        .select(`
            id,
            created_at,
            plano_final,
            modelo_ia,
            titulo,
            historico_chat,
            prompt:prompts_ia(nome_prompt),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id_paciente', pacienteId)
        .order('created_at', { ascending: false })

    // Se erro de coluna inexistente (42703), tenta sem 'titulo' e sem 'modelo_ia' (fallback legado seguro)
    if (error && error.code === '42703') {
        console.warn('Coluna titulo ou modelo_ia nao encontrada em planos_intervencao_ia. Usando fallback minimo.')
        const fallback = await supabase
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

        if (fallback.error) {
            console.error('Erro ao buscar planos IA (fallback):', fallback.error)
            return []
        }
        planos = fallback.data as any
    } else if (error) {
        console.error('Erro ao buscar planos IA:', error)
        return []
    }

    return planos?.map((p: any) => ({
        id: p.id,
        created_at: p.created_at,
        plano_final: p.plano_final,
        modelo_ia: p.modelo_ia || 'IA',
        terapeuta: p.terapeuta,
        titulo: p.titulo || p.prompt?.nome_prompt || 'Plano de Intervenção',
        historico_chat: p.historico_chat || [] // Agora incluído
    })) || []
}

// --- Helpers de Ludoterapia ---

async function getJogosDisponiveisTexto(supabase: any, clinicaId: number) {
    if (!clinicaId) return 'Clínica não identificada.'

    // Busca jogos licenciados
    const { data: jogos, error } = await supabase
        .from('saas_clinicas_jogos')
        .select(`
            ativo,
            jogo:saas_jogos (
                nome,
                recursos_terapeuticos,
                habilidades:saas_jogos_habilidades (
                    habilidade:saas_habilidades (nome)
                )
            )
        `)
        .eq('clinica_id', clinicaId)
        .eq('ativo', true)

    if (error) console.error('Erro ao buscar jogos:', error)
    if (!jogos || jogos.length === 0) return 'Nenhum jogo digital (Robô Tirilo) disponível/licenciado nesta clínica.'

    return jogos.map((item: any) => {
        const j = item.jogo
        // Safe navigation para arrays aninhados
        const habilidades = j.habilidades?.map((h: any) => h.habilidade?.nome).filter(Boolean).join(', ')
        const foco = habilidades ? `(Foco: ${habilidades})` : ''
        return `- ${j.nome} ${foco}`
    }).join('\n')
}

async function getHistoricoLudicoTexto(supabase: any, pacienteId: number) {
    const { data: sessoes, error } = await supabase
        .from('sessao_ludica')
        .select(`
            data_inicio,
            pontuacao_final,
            nivel_dificuldade,
            metricas,
            jogo:saas_jogos(nome)
        `)
        .eq('paciente_id', pacienteId)
        .order('data_inicio', { ascending: false })
        .limit(5)

    if (error) console.error('Erro ao buscar histórico lúdico:', error)
    if (!sessoes || sessoes.length === 0) return 'Nenhum histórico de jogos registrado com o Robô.'

    return sessoes.map((s: any) => {
        const data = new Date(s.data_inicio).toLocaleDateString('pt-BR')
        // Tenta formatar métricas se existirem
        let metricasTxt = ''
        if (s.metricas && typeof s.metricas === 'object') {
            const m = s.metricas
            const parts = []
            if (m.erros !== undefined) parts.push(`Erros: ${m.erros}`)
            if (m.acertos !== undefined) parts.push(`Acertos: ${m.acertos}`)
            if (parts.length > 0) metricasTxt = `[${parts.join(', ')}]`
        }

        return `- ${data}: ${s.jogo?.nome || 'Jogo Desconhecido'} (${s.nivel_dificuldade || 'N/A'}). Pontos: ${s.pontuacao_final}. ${metricasTxt}`
    }).join('\n')
}

async function getDiarioSessaoTexto(supabase: any, pacienteId: number) {
    // 1. Busca a sessão lúdica mais recente (últimas 24h para garantir relevância)
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    const { data: ultimaSessao } = await supabase
        .from('sessao_ludica')
        .select('id')
        .eq('paciente_id', pacienteId)
        .gte('data_inicio', ontem.toISOString())
        .order('data_inicio', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!ultimaSessao) return 'Nenhum registro automático (diário de bordo) do Robô encontrado nas últimas 24h.'

    // 2. Busca logs dessa sessão
    const { data: logs, error } = await supabase
        .from('sessao_diario_bordo')
        .select('timestamp, texto_transcrito, tipo_evento')
        .eq('sessao_ludica_id', ultimaSessao.id)
        .order('timestamp', { ascending: true })

    if (error) console.error('Erro ao buscar diário:', error)
    if (!logs || logs.length === 0) return 'Sessão registrada, mas sem transcrições de áudio/texto.'

    return logs.map((l: any) => {
        const hora = new Date(l.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        const prefixo = l.tipo_evento === 'FALA_ROBO' ? '[Robô]' : '[Audio]'
        return `${prefixo} ${hora}: ${l.texto_transcrito}`
    }).join('\n')
}

export async function refineInterventionPlan(planoId: number, feedbackUsuario: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // 1. Buscar Plano Atual
    const { data: planoRecord, error } = await supabase
        .from('planos_intervencao_ia')
        .select('*')
        .eq('id', planoId)
        .single()

    if (error || !planoRecord) return { success: false, error: 'Plano não encontrado' }

    // 2. Buscar Entidades para Anonimização
    const { data: paciente } = await supabase
        .from('pacientes')
        .select('nome')
        .eq('id', planoRecord.id_paciente)
        .single()

    const { data: terapeuta } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', planoRecord.id_terapeuta)
        .single()

    if (!paciente || !terapeuta) return { success: false, error: 'Dados vinculados não encontrados' }

    // 3. Preparar Anonimização
    const mapRealToFake = {
        [paciente.nome]: 'HORACE',
        [terapeuta.nome_completo]: 'SAM'
    }

    const planoAtualAnon = anonymize(planoRecord.plano_final, mapRealToFake)
    const feedbackAnon = anonymize(feedbackUsuario, mapRealToFake)

    // 4. Configurar IA
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_VERSION })

    const promptRefinamento = `
    ATUAÇÃO: Você é um supervisor clínico rigoroso especialista em ABA.
    OBJETIVO: MODIFICAR o plano atual seguindo ESTRITAMENTE o feedback recebido.
    
    DADOS:
    - Paciente (Fictício): HORACE
    - Plano Atual:
    """
    ${planoAtualAnon}
    """
    
    FEEDBACK DO TERAPEUTA (Alterações obrigatórias):
    "${feedbackAnon}"
    
    INSTRUÇÕES:
    1. Reescreva o plano completo aplicando as mudanças.
    2. NÃO IGNORE O FEEDBACK. Se o terapeuta pediu para remover algo, REMOVA. Se pediu para adicionar, ADICIONE.
    3. Mantenha o tom profissional clínico.
    4. IMPORTANTE: Retorne apenas o texto do plano revisado, sem introduções ou explicações.
    `

    try {
        const result = await model.generateContent(promptRefinamento)
        const responseText = result.response.text()

        // 5. Deanonimizar
        const novoplano = deanonymize(responseText, mapRealToFake)

        // 6. Atualizar Histórico e Plano
        const novoHistorico = [
            ...(planoRecord.historico_chat || []), // Existing history
            {
                role: 'user',
                text: feedbackUsuario,
                timestamp: new Date().toISOString()
            },
            {
                role: 'system',
                text: 'Plano refinado pela IA.',
                timestamp: new Date().toISOString()
            }
        ]

        const { error: updateError } = await supabase
            .from('planos_intervencao_ia')
            .update({
                plano_final: novoplano,
                historico_chat: novoHistorico
            })
            .eq('id', planoId)

        if (updateError) throw updateError

        return { success: true, plano: novoplano, historico: novoHistorico }

    } catch (e: any) {
        console.error('Erro ao refinar plano:', e)
        return { success: false, error: e.message || 'Erro ao comunicar com a IA' }
    }
}
