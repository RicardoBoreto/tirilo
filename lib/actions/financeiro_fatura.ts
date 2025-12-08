
export async function getDetalhesFatura(lancamentoId: number) {
    const supabase = await createClient()

    // 1. Buscar o Lançamento com dados do Paciente/Responsável/Clínica
    const { data: lancamento, error: lancamentoError } = await supabase
        .from('financeiro_lancamentos')
        .select(`
            *,
            paciente:pacientes(nome, cpf),
            responsavel:responsaveis(nome, cpf, endereco, cidade, estado, cep),
            clinica:saas_clinicas(nome_fantasia, cnpj, endereco, telefone, email)
        `)
        .eq('id', lancamentoId)
        .single()

    if (lancamentoError) {
        console.error('Erro ao buscar lançamento:', lancamentoError)
        return null
    }

    // 2. Buscar Agendamentos vinculados a este lançamento
    const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
            id,
            data_hora_inicio,
            tipo_sessao,
            valor_sessao,
            status,
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id_lancamento_financeiro', lancamentoId)
        .order('data_hora_inicio', { ascending: true })

    if (agendamentosError) {
        console.error('Erro ao buscar agendamentos da fatura:', agendamentosError)
    }

    return {
        lancamento,
        agendamentos: agendamentos || []
    }
}
