'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Contrato = {
    id: number
    id_clinica: number
    id_paciente: number
    id_terapeuta?: string // Changed to string UUID
    id_responsavel: number
    tipo_cobranca: 'por_sessao' | 'mensal_fixo'
    valor: number
    data_inicio: string
    data_fim: string | null
    dia_vencimento: number
    ativo: boolean
    status: 'ativo' | 'cancelado' | 'finalizado'
    arquivo_url: string | null
    observacoes: string | null
    created_at: string
}

export type FinanceiroLancamento = {
    id: number
    id_clinica: number
    descricao: string
    valor: number
    data_vencimento: string
    data_pagamento: string | null
    status: 'pendente' | 'pago' | 'cancelado'
    tipo: 'receita' | 'despesa'
    id_paciente: number | null
    id_responsavel: number | null
    id_categoria: number | null
    forma_pagamento: string | null
    comprovante_url: string | null
    created_at: string
}

// ============================================
// CONTRATOS
// ============================================

export async function getContratos(clinicaId?: number) {
    const supabase = await createClient()

    let query = supabase
        .from('contratos')
        .select(`
            *,
            paciente:pacientes(nome),
            responsavel:responsaveis(nome),
            terapeuta:usuarios(nome_completo)
        `)
        .order('id', { ascending: false })

    if (clinicaId) {
        query = query.eq('id_clinica', clinicaId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Erro ao buscar contratos:', error)
        return []
    }

    return data
}

export async function getContratosByTerapeutaId(terapeutaId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('contratos')
        .select(`
            *,
            paciente:pacientes(nome),
            responsavel:responsaveis(nome),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id_terapeuta', terapeutaId)
        .order('ativo', { ascending: false }) // Ativos primeiro
        .order('id', { ascending: false })

    if (error) {
        console.error('Erro ao buscar contratos do terapeuta:', error)
        return []
    }

    return data
}

export async function saveContrato(contratoData: Partial<Contrato>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    // Se tiver ID, atualiza
    if (contratoData.id) {
        const { data, error } = await supabase
            .from('contratos')
            .update(contratoData)
            .eq('id', contratoData.id)
            .select()
            .single()

        if (error) {
            console.error('Erro ao atualizar contrato:', error)
            throw new Error('Erro ao atualizar contrato')
        }
        revalidatePath('/admin/financeiro')
        return data
    }
    // Senão, cria
    else {
        // Garantir id_clinica
        if (!contratoData.id_clinica) {
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('id_clinica')
                .eq('id', user.id)
                .single()

            if (usuario) contratoData.id_clinica = usuario.id_clinica
        }

        const { data, error } = await supabase
            .from('contratos')
            .insert(contratoData)
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar contrato (Supabase Error):', error)
            throw new Error(`Erro ao criar contrato: ${error.message || error.details || 'Erro desconhecido'}`)
        }
        revalidatePath('/admin/financeiro')
        return data
    }
}

export async function getContratoAtivo(pacienteId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('id_paciente', pacienteId)
        .eq('status', 'ativo')
        .eq('ativo', true)
        .single() // Assume um contrato ativo por vez, ou pega o primeiro

    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar contrato ativo:', error)
    }

    return data as Contrato | null
}


// ============================================
// LANÇAMENTOS FINANCEIROS
// ============================================

export async function getLancamentos(filters?: {
    tipo?: 'receita' | 'despesa',
    status?: string,
    mes?: number,
    ano?: number,
    terapeutaId?: string
}) {
    const supabase = await createClient()

    let query = supabase
        .from('financeiro_lancamentos')
        .select(`
            *,
            paciente:pacientes(nome),
            responsavel:responsaveis(nome),
            categoria:financeiro_categorias(nome)
        `)
        .order('data_vencimento', { ascending: true })

    if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo)
    }
    if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status)
    }
    if (filters?.mes && filters?.ano) {
        const startDate = `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`
        const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0] // Último dia do mês
        query = query.gte('data_vencimento', startDate).lte('data_vencimento', endDate)
    }

    if (filters?.terapeutaId && filters.terapeutaId !== 'todos') {
        // Filter launches where associated appointments belong to this therapist
        const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id_lancamento_financeiro')
            .eq('id_terapeuta', filters.terapeutaId)
            .not('id_lancamento_financeiro', 'is', null)

        const launchIds = agendamentos?.map(a => a.id_lancamento_financeiro) || []

        if (launchIds.length > 0) {
            query = query.in('id', launchIds)
        } else {
            return [] // No launches found for this therapist
        }
    }

    const { data, error } = await query

    if (error) {
        console.error('Erro ao buscar lançamentos:', error)
        return []
    }

    return data
}

export async function createLancamento(lancamentoData: Partial<FinanceiroLancamento>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    if (!lancamentoData.id_clinica) {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('id_clinica')
            .eq('id', user.id)
            .single()

        if (usuario) lancamentoData.id_clinica = usuario.id_clinica
    }

    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .insert(lancamentoData)
        .select()
        .single()

    if (error) {
        console.error('Erro ao criar lançamento:', error)
        throw new Error('Erro ao criar lançamento financeiro')
    }

    revalidatePath('/admin/financeiro')
    return data
}

export async function baixarLancamento(id: number, dataPagamento: string, formaPagamento: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .update({
            status: 'pago',
            data_pagamento: dataPagamento,
            forma_pagamento: formaPagamento
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Erro ao baixar lançamento:', error)
        throw new Error('Erro ao registrar pagamento')
    }

    revalidatePath('/admin/financeiro')
    revalidatePath('/admin/financeiro')
    return data
}

export async function baixarLancamentoComComprovante(formData: FormData) {
    const supabase = await createClient()
    const id = Number(formData.get('id'))
    const dataPagamento = formData.get('data_pagamento') as string
    const formaPagamento = formData.get('forma_pagamento') as string
    const file = formData.get('comprovante') as File | null

    let comprovanteUrl = null

    if (file && file.size > 0) {
        // Upload logic
        const fileExt = file.name.split('.').pop()
        const fileName = `${id}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('comprovantes')
            .upload(filePath, file)

        if (uploadError) throw new Error('Erro ao fazer upload do comprovante')
        comprovanteUrl = filePath
    }

    const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .update({
            status: 'pago',
            data_pagamento: dataPagamento,
            forma_pagamento: formaPagamento,
            comprovante_url: comprovanteUrl
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Erro ao baixar:', error)
        throw new Error('Erro ao registrar pagamento')
    }

    revalidatePath('/admin/financeiro')
    return data
}

export async function estornarLancamento(id: number) {
    const supabase = await createClient()

    // Opcional: Deletar arquivo antigo? Por segurança, mantemos no bucket, apenas desligamos do registro.

    const { error } = await supabase
        .from('financeiro_lancamentos')
        .update({
            status: 'pendente',
            data_pagamento: null,
            forma_pagamento: null,
            comprovante_url: null
        })
        .eq('id', id)

    if (error) throw new Error('Erro ao estornar')

    revalidatePath('/admin/financeiro')
}

export async function getComprovanteUrl(path: string) {
    const supabase = await createClient()
    const { data } = await supabase.storage
        .from('comprovantes')
        .createSignedUrl(path, 60 * 60) // 1 hora

    return data?.signedUrl
}

// ============================================
// FATURAMENTO (GERAÇÃO DE COBRANÇA)
// ============================================

export async function gerarFaturamentoSessoes(agendamentosIds: number[], contratoId: number | null, mesReferencia: string) {
    const supabase = await createClient()

    // 1. Buscar detalhes dos agendamentos
    const { data: agendamentos, error: agError } = await supabase
        .from('agendamentos')
        .select(`
            *,
            paciente:pacientes(nome, valor_sessao_padrao),
            terapeuta:usuarios(nome_completo)
        `)
        .in('id', agendamentosIds)
        .is('id_lancamento_financeiro', null) // Garantir que não foram faturados

    if (agError || !agendamentos || agendamentos.length === 0) {
        throw new Error('Nenhum agendamento válido encontrado para faturamento')
    }

    const primeiroAgendamento = agendamentos[0]
    const idPaciente = primeiroAgendamento.id_paciente
    const idClinica = primeiroAgendamento.id_clinica

    // 2. Buscar Contrato (se fornecido ou buscar ativo)
    let contrato: Contrato | null = null
    if (contratoId) {
        const { data } = await supabase.from('contratos').select('*').eq('id', contratoId).single()
        contrato = data
    } else {
        contrato = await getContratoAtivo(idPaciente)
    }

    // 3. Calcular Valor Total
    let valorTotal = 0
    let descricao = `Faturamento Ref: ${mesReferencia}`

    if (contrato && contrato.tipo_cobranca === 'mensal_fixo') {
        valorTotal = contrato.valor
        descricao += ` - Mensalidade Fixa (Contrato #${contrato.id})`
    } else {
        // Por sessão
        valorTotal = agendamentos.reduce((acc, curr) => {
            // Prioridade de valor: Agendamento > Contrato (unitario) > Paciente > 0
            let valorSessao = curr.valor_sessao || (contrato ? contrato.valor : (curr.paciente.valor_sessao_padrao || 0))
            return acc + Number(valorSessao)
        }, 0)
        descricao += ` - ${agendamentos.length} Sessões Realizadas`
    }

    // 4. Criar Lançamento Financeiro
    const vencimento = contrato ?
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, contrato.dia_vencimento).toISOString() :
        new Date(new Date().setDate(new Date().getDate() + 5)).toISOString() // Fallback: 5 dias

    const lancamento = await createLancamento({
        id_clinica: idClinica,
        descricao,
        valor: valorTotal,
        data_vencimento: vencimento,
        tipo: 'receita',
        status: 'pendente',
        id_paciente: idPaciente,
        id_responsavel: contrato?.id_responsavel,
    })

    if (!lancamento) throw new Error('Falha ao criar lançamento')

    // 5. Atualizar Agendamentos (Vincular ao Lançamento)
    // Se for mensal fixo, vinculamos todos os agendamentos do período a este lançamento
    const { error: updateError } = await supabase
        .from('agendamentos')
        .update({
            id_lancamento_financeiro: lancamento.id
        })
        .in('id', agendamentosIds)

    if (updateError) {
        console.error('Erro ao vincular agendamentos:', updateError)
        // Rollback idealmente, mas aqui vamos só logar por enquanto
    }

    revalidatePath('/admin/financeiro')
    return { success: true, lancamentoId: lancamento.id }
}

export async function getResumoFinanceiro(mes?: number, ano?: number, terapeutaId?: string) {
    const supabase = await createClient()
    const now = new Date()
    const currentMes = mes || now.getMonth() + 1
    const currentAno = ano || now.getFullYear()

    // Início e Fim do mês selecionado
    const startDate = `${currentAno}-${String(currentMes).padStart(2, '0')}-01`
    const endDate = new Date(currentAno, currentMes, 0).toISOString().split('T')[0]

    let query = supabase
        .from('financeiro_lancamentos')
        .select('id, valor, tipo, status')
        .gte('data_vencimento', startDate)
        .lte('data_vencimento', endDate)

    if (terapeutaId && terapeutaId !== 'todos') {
        // Filter launches where associated appointments belong to this therapist
        const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id_lancamento_financeiro')
            .eq('id_terapeuta', terapeutaId)
            .not('id_lancamento_financeiro', 'is', null)

        const launchIds = agendamentos?.map(a => a.id_lancamento_financeiro) || []

        // Also check manual launches created by this therapist? 
        // Typically summaries are about "Productivity". 
        // If the query list is empty, return empty stats?
        if (launchIds.length > 0) {
            query = query.in('id', launchIds)
        } else {
            // Return zero stats immediately if no related launches found
            return {
                mes: currentMes,
                ano: currentAno,
                receitaPrevista: 0,
                receitaRealizada: 0,
                despesaPrevista: 0,
                despesaRealizada: 0,
                saldoPrevisto: 0,
                saldoRealizado: 0
            }
        }
    }

    const { data: lancamentos } = await query

    let receitaPrevista = 0
    let receitaRealizada = 0
    let despesaPrevista = 0
    let despesaRealizada = 0

    lancamentos?.forEach(l => {
        const val = Number(l.valor)
        if (l.tipo === 'receita') {
            receitaPrevista += val
            if (l.status === 'pago') receitaRealizada += val
        } else {
            despesaPrevista += val
            if (l.status === 'pago') despesaRealizada += val
        }
    })

    return {
        mes: currentMes,
        ano: currentAno,
        receitaPrevista,
        receitaRealizada,
        despesaPrevista,
        despesaRealizada,
        saldoPrevisto: receitaPrevista - despesaPrevista,
        saldoRealizado: receitaRealizada - despesaRealizada
    }
}

// ============================================
// STORAGE (CONTRATOS)
// ============================================

export async function uploadContrato(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) throw new Error('Nenhum arquivo enviado')

    // Validar tamanho (ex: 5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.')
    }

    // Validar tipo (PDF)
    if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos.')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
        .from('contratos')
        .upload(filePath, file, {
            upsert: false
        })

    if (error) {
        console.error('Erro upload:', error)
        throw new Error(`Erro ao fazer upload: ${error.message}`)
    }

    return filePath
}

export async function getContratoUrl(path: string) {
    const supabase = await createClient()

    // Se o path for uma URL completa (legado ou erro), tenta extrair ou retornar direto?
    // Vamos assumir que saveContrato salva apenas o path relativo.

    const { data, error } = await supabase.storage
        .from('contratos')
        .createSignedUrl(path, 60 * 60) // 1 hora

    if (error) {
        console.error('Erro ao gerar URL assinada:', error)
        return null
    }

    return data?.signedUrl
}
