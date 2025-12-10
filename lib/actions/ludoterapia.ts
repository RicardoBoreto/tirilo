'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Habilidade = {
    id: string
    nome: string
    descricao: string | null
    codigo_ia: string | null
}

export async function getHabilidades() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_habilidades')
        .select('*')
        .order('nome')

    if (error) {
        console.error('Erro ao buscar habilidades:', error)
        return []
    }

    return data as Habilidade[]
}

export async function createHabilidade(formData: FormData) {
    const supabase = await createClient()

    const nome = formData.get('nome') as string
    const descricao = formData.get('descricao') as string
    const codigo_ia = formData.get('codigo_ia') as string

    if (!nome) return { error: 'Nome é obrigatório' }

    const { error } = await supabase
        .from('saas_habilidades')
        .insert({ nome, descricao, codigo_ia })

    if (error) return { error: error.message }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export async function deleteHabilidade(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('saas_habilidades')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export async function vincularHabilidadeJogo(jogoId: string, habilidadeId: string, nivel: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('saas_jogos_habilidades')
        .insert({
            jogo_id: jogoId,
            habilidade_id: habilidadeId,
            nivel_impacto: nivel
        })

    if (error) return { error: error.message }

    revalidatePath(`/admin/jogos/${jogoId}`) // Ajuste conforme rota de edição
    return { success: true }
}

export async function desvincularHabilidadeJogo(jogoId: string, habilidadeId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('saas_jogos_habilidades')
        .delete()
        .match({ jogo_id: jogoId, habilidade_id: habilidadeId })

    if (error) return { error: error.message }

    revalidatePath(`/admin/jogos/${jogoId}`)
    return { success: true }
}

export async function getHabilidadesDoJogo(jogoId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_jogos_habilidades')
        .select(`
            nivel_impacto,
            habilidade:saas_habilidades(*)
        `)
        .eq('jogo_id', jogoId)

    if (error) {
        console.error(error)
        return []
    }

    return data.map((item: any) => ({
        ...item.habilidade,
        nivel_impacto: item.nivel_impacto
    }))
}

// --- Histórico Clínico ---

export async function getSessoesLudicas(pacienteId: number) {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('sessao_ludica')
        .select(`
            *,
            jogo:saas_jogos(nome, categoria),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('paciente_id', pacienteId)
        .order('data_inicio', { ascending: false })

    if (error) {
        console.error('Erro ao buscar sessões lúdicas:', error)
        return []
    }

    return data
}

export async function getSessaoDetalhes(sessaoId: string) {
    const supabase = await createAdminClient()

    // 1. Dados da Sessão
    const { data: sessao, error: errSessao } = await supabase
        .from('sessao_ludica')
        .select(`
            *,
            jogo:saas_jogos(*),
            terapeuta:usuarios(nome_completo)
        `)
        .eq('id', sessaoId)
        .single()

    if (errSessao) return { error: errSessao.message }

    // 2. Diário de Bordo (Transcrições e Eventos)
    const { data: diario, error: errDiario } = await supabase
        .from('sessao_diario_bordo')
        .select('*')
        .eq('sessao_ludica_id', sessaoId)
        .order('timestamp', { ascending: true })

    if (errDiario) console.error("Erro ao buscar diário:", errDiario)

    return { sessao, diario: diario || [] }
}

// --- Loja de Apps ---

export async function getLojaJogos(clinicaId: number) {
    const supabase = await createClient()

    // 1. Busca Todos os Jogos Ativos
    const { data: jogos, error: errJogos } = await supabase
        .from('saas_jogos')
        .select('*, habilidades:saas_jogos_habilidades(habilidade:saas_habilidades(nome))')
        .eq('ativo', true)
        .order('nome')

    if (errJogos) {
        console.error("Erro ao buscar jogos da loja:", errJogos)
        return []
    }

    // 2. Busca Jogos Já Adquiridos pela Clínica
    const { data: adquiridos, error: errAdq } = await supabase
        .from('saas_clinicas_jogos')
        .select('jogo_id, ativo')
        .eq('clinica_id', clinicaId)

    // Set de IDs adquiridos
    const adquiridosSet = new Set(adquiridos?.map((a: any) => a.jogo_id))

    // 3. Mescla dados
    return jogos.map((jogo: any) => ({
        ...jogo,
        adquirido: adquiridosSet.has(jogo.id),
        habilidades_nomes: jogo.habilidades?.map((h: any) => h.habilidade.nome) || []
    }))
}

export async function adquirirJogo(clinicaId: number, jogoId: string) {
    const supabase = await createClient()

    // Aqui poderia ter verificação de saldo/pagamento
    // Por enquanto é aquisição direta (free ou pós-pago)

    const { error } = await supabase
        .from('saas_clinicas_jogos')
        .insert({
            clinica_id: clinicaId,
            jogo_id: jogoId,
            ativo: true,
            licenca_tipo: 'PERPETUA' // Default por enquanto
        })

    if (error) return { error: error.message }

    revalidatePath(`/clinica/${clinicaId}/loja`)
    return { success: true }
}
