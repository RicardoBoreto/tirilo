'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for validation
const EquipeSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    tipo_perfil: z.enum(['terapeuta', 'recepcao']),
    // Optional fields
    telefone: z.string().optional().nullable(),
    registro_profissional: z.string().optional().nullable(),
    especialidade: z.string().optional().nullable(),
})

export type MembroEquipe = {
    id: string
    nome_completo: string
    apelido?: string
    email: string
    tipo_perfil: 'terapeuta' | 'recepcao' | 'admin'
    celular_whatsapp?: string
    foto_url?: string
    created_at: string
    ativo: boolean
}

export async function getEquipe() {
    const supabase = await createClient()

    // RLS ensures we only see users from our clinic
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .in('tipo_perfil', ['terapeuta', 'recepcao', 'admin'])
        .order('nome_completo')

    if (error) {
        console.error('Erro ao buscar equipe:', error)
        return []
    }

    return data as MembroEquipe[]
}

export async function toggleStatusMembro(id: string, novoStatus: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('usuarios')
        .update({ ativo: novoStatus })
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar status do membro:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/equipe')
    return { success: true }
}

export async function updateMembroEquipe(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    const rawData = {
        nome: formData.get('nome'),
        apelido: formData.get('apelido') || null,
        telefone: formData.get('telefone') || null,
        registro_profissional: formData.get('registro_profissional') || null,
        especialidade: formData.get('especialidade') || null,
    }

    // Validate basic fields
    if (!rawData.nome || typeof rawData.nome !== 'string' || rawData.nome.length < 3) {
        return { error: 'Nome deve ter pelo menos 3 caracteres' }
    }

    // Update usuarios table
    const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update({
            nome_completo: rawData.nome,
            apelido: rawData.apelido,
            celular_whatsapp: rawData.telefone,
        })
        .eq('id', id)

    if (userUpdateError) {
        console.error('Error updating user:', userUpdateError)
        return { error: 'Erro ao atualizar usuário: ' + userUpdateError.message }
    }

    // If therapist, update curriculum
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('tipo_perfil')
        .eq('id', id)
        .single()

    if (userProfile?.tipo_perfil === 'terapeuta') {
        const { error: curriculoError } = await supabase
            .from('terapeutas_curriculo')
            .update({
                registro_profissional: rawData.registro_profissional,
                especialidades: rawData.especialidade ? [rawData.especialidade] : null
            })
            .eq('id_usuario', id)

        if (curriculoError) {
            console.error('Error updating curriculum:', curriculoError)
            // Non-critical, don't fail the whole operation
        }
    }

    revalidatePath('/admin/equipe')
    return { success: true }
}


export async function createMembroEquipe(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    // Get current user's clinic
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return { error: 'Clínica não identificada' }

    const rawData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        apelido: formData.get('apelido') || null,
        tipo_perfil: formData.get('tipo_perfil'),
        telefone: formData.get('telefone') || null,
        registro_profissional: formData.get('registro_profissional') || null,
        especialidade: formData.get('especialidade') || null,
    }

    const validated = EquipeSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.errors[0].message }
    }

    const { email, nome, tipo_perfil, telefone } = validated.data

    // Import admin client to create Auth User
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'Tirilo2025!', // Default password
        email_confirm: true,
        user_metadata: {
            nome: nome,
            id_clinica: userProfile.id_clinica,
            tipo_perfil: tipo_perfil
        }
    })

    if (authError) {
        console.error('Error creating auth user:', authError)
        return { error: 'Erro ao criar usuário no Auth: ' + authError.message }
    }

    if (!authUser.user) {
        return { error: 'Erro inesperado: Usuário não criado.' }
    }

    // 2. Insert into usuarios table
    const { error: userInsertError } = await supabase
        .from('usuarios')
        .insert({
            id: authUser.user.id,
            email: email,
            nome_completo: nome,
            apelido: rawData.apelido,
            celular_whatsapp: telefone || null,
            tipo_perfil: tipo_perfil,
            id_clinica: userProfile.id_clinica
        })

    if (userInsertError) {
        console.error('Error creating user profile:', userInsertError)
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return { error: 'Erro ao criar perfil do usuário: ' + userInsertError.message }
    }

    // 3. If Therapist, create basic curriculum entry (optional but good for consistency)
    if (tipo_perfil === 'terapeuta') {
        const { error: curriculoError } = await supabase
            .from('terapeutas_curriculo')
            .insert({
                id_usuario: authUser.user.id,
                id_clinica: userProfile.id_clinica,
                registro_profissional: validated.data.registro_profissional || null,
                especialidades: validated.data.especialidade ? [validated.data.especialidade] : null
            })

        if (curriculoError) {
            console.error('Error creating curriculum:', curriculoError)
            // Non-critical error, don't rollback user
        }
    }

    revalidatePath('/admin/equipe')
    return { success: true }
}
