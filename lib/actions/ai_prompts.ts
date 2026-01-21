'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPromptById(id: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('prompts_ia')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data as PromptIA
}

export type PromptIA = {
    id: number
    id_clinica: number
    terapeuta_id: string
    nome_prompt: string
    descricao: string | null
    prompt_texto: string
    modelo_gemini: string
    temperatura: number
    ativo: boolean
    categoria: string | null
    criado_por: string | null
    created_at: string
}

export async function getPrompts(terapeutaIdFilter?: string) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return []

    let query = supabase
        .from('prompts_ia')
        .select('*')
        .eq('id_clinica', userProfile.id_clinica)

    // Se for terapeuta, só vê os seus E os da clínica (templates)
    if (userProfile.tipo_perfil === 'terapeuta') {
        // Obter IDs de admins da clínica para mostrar os prompts deles também (templates)
        const { data: adminUsers } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('id_clinica', userProfile.id_clinica)
            .in('tipo_perfil', ['admin', 'super_admin', 'admin_clinica', 'master_admin'])

        const adminIds = adminUsers?.map(u => u.id) || []
        const allowedIds = [user.id, ...adminIds]

        query = query.in('terapeuta_id', allowedIds)
    }
    // Se for admin (ou outro) e tiver filtro, aplica
    else if (terapeutaIdFilter && terapeutaIdFilter !== 'all') {
        query = query.eq('terapeuta_id', terapeutaIdFilter)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar prompts:', JSON.stringify(error, null, 2))
        return []
    }

    return data as PromptIA[]
}

export async function getActivePrompts() {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return []

    let query = supabase
        .from('prompts_ia')
        .select('*')
        .eq('id_clinica', userProfile.id_clinica)
        .eq('ativo', true)

    if (userProfile.tipo_perfil === 'terapeuta') {
        // Obter IDs de admins da clínica para mostrar os prompts deles também (templates)
        // Usamos supabaseAdmin pois o terapeuta pode não ter permissão de listar usuários
        const { data: adminUsers } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('id_clinica', userProfile.id_clinica)
            .in('tipo_perfil', ['admin', 'super_admin', 'admin_clinica', 'master_admin'])

        const adminIds = adminUsers?.map(u => u.id) || []
        const allowedIds = [user.id, ...adminIds]

        query = query.in('terapeuta_id', allowedIds)
    }

    const { data, error } = await query.order('nome_prompt', { ascending: true })

    if (error) {
        console.error('Erro ao buscar prompts ativos:', error)
        return []
    }

    return data as PromptIA[]
}

export async function createPrompt(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return { success: false, error: 'Usuário sem clínica' }

    let terapeutaId = user.id
    // Se não for terapeuta (ex: admin), pode definir o dono do prompt
    if (userProfile.tipo_perfil !== 'terapeuta') {
        const formTerapeutaId = formData.get('terapeuta_id') as string
        if (formTerapeutaId) {
            terapeutaId = formTerapeutaId
        }
    }

    const promptData = {
        id_clinica: userProfile.id_clinica,
        terapeuta_id: terapeutaId,
        nome_prompt: formData.get('nome_prompt') as string,
        descricao: formData.get('descricao') as string,
        prompt_texto: formData.get('prompt_texto') as string,
        modelo_gemini: formData.get('modelo_gemini') as string || 'gemini-2.5-flash',
        temperatura: Number(formData.get('temperatura')) || 0.7,
        categoria: formData.get('categoria') as string || 'plano',
        ativo: true,
        criado_por: user.id
    }

    const { error } = await supabase
        .from('prompts_ia')
        .insert(promptData)

    if (error) {
        console.error('Erro ao criar prompt:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/prompts-ia')
    return { success: true }
}

export async function updatePrompt(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // Check permission
    const { data: prompt } = await supabase.from('prompts_ia').select('terapeuta_id').eq('id', id).single()
    const { data: userProfile } = await supabase.from('usuarios').select('tipo_perfil').eq('id', user.id).single()

    if (!prompt) return { success: false, error: 'Prompt não encontrado' }

    if (userProfile?.tipo_perfil === 'terapeuta' && prompt.terapeuta_id !== user.id) {
        return { success: false, error: 'Permissão negada' }
    }

    const promptData: any = {
        nome_prompt: formData.get('nome_prompt') as string,
        descricao: formData.get('descricao') as string,
        prompt_texto: formData.get('prompt_texto') as string,
        modelo_gemini: formData.get('modelo_gemini') as string,
        temperatura: Number(formData.get('temperatura')),
        categoria: formData.get('categoria') as string || 'plano',
        ativo: formData.get('ativo') === 'true'
    }

    // Se for admin, pode alterar o dono
    if (userProfile?.tipo_perfil !== 'terapeuta') {
        const formTerapeutaId = formData.get('terapeuta_id') as string
        if (formTerapeutaId) {
            promptData.terapeuta_id = formTerapeutaId
        }
    }

    const { error } = await supabase
        .from('prompts_ia')
        .update(promptData)
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar prompt:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/prompts-ia')
    return { success: true }
}

export async function deletePrompt(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // Check permission
    const { data: prompt } = await supabase.from('prompts_ia').select('terapeuta_id').eq('id', id).single()
    const { data: userProfile } = await supabase.from('usuarios').select('tipo_perfil').eq('id', user.id).single()

    if (!prompt) return { success: false, error: 'Prompt não encontrado' }

    if (userProfile?.tipo_perfil === 'terapeuta' && prompt.terapeuta_id !== user.id) {
        return { success: false, error: 'Permissão negada' }
    }

    const { error, count } = await supabase
        .from('prompts_ia')
        .delete({ count: 'exact' })
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar prompt:', error)
        return { success: false, error: error.message }
    }

    if (count === 0) {
        console.error('Nenhum prompt deletado. Verifique permissões ou ID.', id)
        return { success: false, error: 'Não foi possível deletar o prompt (permissão ou não encontrado).' }
    }

    console.log('Prompt deletado com sucesso:', id)

    revalidatePath('/admin/prompts-ia')
    return { success: true }
}

export async function togglePromptStatus(id: number, currentStatus: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // Check permission
    const { data: prompt } = await supabase.from('prompts_ia').select('terapeuta_id').eq('id', id).single()
    const { data: userProfile } = await supabase.from('usuarios').select('tipo_perfil').eq('id', user.id).single()

    if (!prompt) return { success: false, error: 'Prompt não encontrado' }

    if (userProfile?.tipo_perfil === 'terapeuta' && prompt.terapeuta_id !== user.id) {
        return { success: false, error: 'Permissão negada' }
    }

    const { error } = await supabase
        .from('prompts_ia')
        .update({ ativo: !currentStatus })
        .eq('id', id)

    if (error) {
        console.error('Erro ao alterar status do prompt:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/prompts-ia')
    return { success: true }
}
