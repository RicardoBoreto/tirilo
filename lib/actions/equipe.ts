'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for validation
const EquipeSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    tipo_perfil: z.enum(['terapeuta', 'recepcao', 'admin', 'financeiro']),
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
    tipo_perfil: 'terapeuta' | 'recepcao' | 'admin' | 'financeiro'
    celular_whatsapp?: string
    foto_url?: string
    created_at: string
    ativo: boolean
    terapeutas_curriculo?: {
        registro_profissional?: string
        especialidades?: string[]
        valor_hora_padrao?: number
        porcentagem_repasse?: number
    }
}

export async function getCurrentUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('usuarios')
        .select('id, nome_completo, tipo_perfil, id_clinica')
        .eq('id', user.id)
        .single()

    if (data && data.tipo_perfil === 'terapeuta') {
        const { data: curriculo } = await supabase
            .from('terapeutas_curriculo')
            .select('*')
            .eq('id_usuario', user.id)
            .single()

        return {
            ...data,
            terapeutas_curriculo: curriculo
        }
    }

    return data
}

export async function getEquipe() {
    const supabase = await createClient()

    // 1. Fetch Users
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .in('tipo_perfil', ['terapeuta', 'recepcao', 'admin', 'financeiro'])
        .order('nome_completo')

    if (error) {
        console.error('Erro ao buscar equipe:', error)
        return []
    }

    // 2. Fetch Curriculums for Therapists separately (avoids Join/RLS issues blocking the whole list)
    const therapistIds = users
        .filter((u: any) => u.tipo_perfil === 'terapeuta')
        .map((u: any) => u.id)

    let curriculosMap: Record<string, any> = {}

    if (therapistIds.length > 0) {
        const { data: curriculos } = await supabase
            .from('terapeutas_curriculo')
            .select('id_usuario, registro_profissional, especialidades, valor_hora_padrao, porcentagem_repasse')
            .in('id_usuario', therapistIds)

        if (curriculos) {
            curriculos.forEach((c: any) => {
                curriculosMap[c.id_usuario] = c
            })
        }
    }

    // 3. Merge data
    const formattedData = users.map((user: any) => ({
        ...user,
        terapeutas_curriculo: curriculosMap[user.id] || null
    }))

    return formattedData as MembroEquipe[]
}

export async function getTerapeutas() {
    const supabase = await createClient()

    // 1. Get current user's clinic to ensure data isolation
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get clinic ID if not present in metadata (it usually is for our setup, but let's be safe via query)
    // Actually our RLS for usuarios 'select' returns everything if not bounded.
    // Let's filter by clinic explicitly if possible.
    // Fast path: check user metadata? Or just fetch user profile first.

    const { data: currentUserProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!currentUserProfile?.id_clinica) {
        console.error('Clinica não encontrada para o usuário atual')
        return []
    }

    const start = performance.now()

    // 2. Fetch Users (Therapists only)
    const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_clinica', currentUserProfile.id_clinica)
        .eq('tipo_perfil', 'terapeuta')
        .order('nome_completo')

    if (userError) {
        console.error('Erro ao buscar terapeutas (users):', userError)
        return []
    }

    if (!users || users.length === 0) return []

    // 3. Fetch Curriculums separateley
    const userIds = users.map((u: any) => u.id)
    const { data: curriculos, error: currError } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .in('id_usuario', userIds)

    if (currError) {
        console.error('Erro ao buscar currículos:', currError)
        // Ensure we still return users even if curriculum fails
    }

    // 4. Merge
    const curriculoMap: Record<string, any> = {}
    curriculos?.forEach((c: any) => {
        curriculoMap[c.id_usuario] = c
    })

    const result = users.map((u: any) => ({
        ...u,
        terapeutas_curriculo: curriculoMap[u.id] || null
    }))

    return result
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleStatusMembro(id: string, novoStatus: boolean) {
    const supabase = await createClient() // Keep for auth check
    const supabaseAdmin = createAdminClient() // Use for DB operations

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // 2. Perform Update using Admin Client to bypass RLS
    const { error } = await supabaseAdmin
        .from('usuarios')
        // @ts-ignore
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
    const supabaseAdmin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    const rawData = {
        nome: formData.get('nome'),
        apelido: formData.get('apelido') || null,
        telefone: formData.get('telefone') || null,
        registro_profissional: formData.get('registro_profissional') || null,
        especialidade: formData.get('especialidade') || null,
        tipo_perfil: formData.get('tipo_perfil')
    }

    // Validate basic fields
    if (!rawData.nome || typeof rawData.nome !== 'string' || rawData.nome.length < 3) {
        return { error: 'Nome deve ter pelo menos 3 caracteres' }
    }

    // Update usuarios table via Admin
    const { error: userUpdateError } = await supabaseAdmin
        .from('usuarios')
        // @ts-ignore
        .update({
            nome_completo: rawData.nome,
            apelido: rawData.apelido,
            celular_whatsapp: rawData.telefone,
            tipo_perfil: rawData.tipo_perfil || undefined,
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

    if (rawData.tipo_perfil === 'terapeuta' || userProfile?.tipo_perfil === 'terapeuta') {
        const valorHora = formData.get('valor_hora_padrao')
        const porcentagemRepasse = formData.get('porcentagem_repasse')

        // Check if curriculum exists
        const { data: existingCurriculo } = await supabaseAdmin
            .from('terapeutas_curriculo')
            .select('id')
            .eq('id_usuario', id)
            .single()

        if (existingCurriculo) {
            // Update existing
            const { error: curriculoError } = await supabaseAdmin
                .from('terapeutas_curriculo')
                // @ts-ignore
                .update({
                    registro_profissional: rawData.registro_profissional,
                    especialidades: rawData.especialidade ? [rawData.especialidade] : null,
                    valor_hora_padrao: valorHora ? parseFloat(valorHora.toString()) : null,
                    porcentagem_repasse: porcentagemRepasse ? parseFloat(porcentagemRepasse.toString()) : null
                })
                .eq('id_usuario', id)

            if (curriculoError) console.error('Error updating curriculum:', curriculoError)
        } else {
            // Create new if switching to therapist and none exists
            // We need clinic ID
            const { data: userWithClinic } = await supabaseAdmin
                .from('usuarios')
                .select('id_clinica')
                .eq('id', id)
                .single()

            if (userWithClinic?.id_clinica) {
                const { error: insertError } = await supabaseAdmin
                    .from('terapeutas_curriculo')
                    .insert({
                        id_usuario: id,
                        id_clinica: userWithClinic.id_clinica,
                        registro_profissional: rawData.registro_profissional?.toString() || null,
                        especialidades: rawData.especialidade ? [rawData.especialidade.toString()] : null,
                        valor_hora_padrao: valorHora ? parseFloat(valorHora.toString()) : null,
                        porcentagem_repasse: porcentagemRepasse ? parseFloat(porcentagemRepasse.toString()) : null
                    })
                if (insertError) console.error('Error creating curriculum:', insertError)
            }
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
