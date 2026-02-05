'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const TerapeutaSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    cpf: z.string().optional(),
    celular: z.string().optional(),
    registro_profissional: z.string().optional(),
    formacao: z.string().optional(),
    especialidades: z.string().optional(), // Will be split by comma
    publico_alvo: z.string().optional(), // Will be split by comma
    bio: z.string().optional(),
    tecnicas_preferidas: z.string().optional(),
    recursos_preferidos: z.string().optional(),
    estilo_conducao: z.string().optional(),
    observacoes_clinicas: z.string().optional(),
    valor_hora_padrao: z.string().optional(),
    porcentagem_repasse: z.string().optional(),
    chave_pix: z.string().optional(),
})



export async function getTerapeutas(options?: { onlyActive?: boolean }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    // Get user's clinic
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil, nome_completo')
        .eq('id', user.id)
        .single()

    if (userError) {
        console.error('Error fetching user data:', userError)
        throw new Error('Erro ao buscar dados do usuário: ' + userError.message)
    }

    if (!userData?.id_clinica) {
        console.error('User has no clinic:', userData)
        throw new Error('Usuário não vinculado a uma clínica. Tipo de perfil: ' + (userData?.tipo_perfil || 'desconhecido'))
    }

    const clinicId = userData.id_clinica

    // Get clinic limits
    const { data: clinicData, error: clinicError } = await supabase
        .from('saas_clinicas')
        .select('max_terapeutas')
        .eq('id', clinicId)
        .single()

    if (clinicError) {
        console.error('Error fetching clinic data:', clinicError)
        throw new Error('Erro ao buscar dados da clínica: ' + clinicError.message)
    }

    // Build query
    let query = supabase
        .from('usuarios')
        .select('*')
        .eq('id_clinica', clinicId)
        .eq('tipo_perfil', 'terapeuta')
        .order('created_at', { ascending: false })

    if (options?.onlyActive) {
        query = query.eq('ativo', true)
    }

    // Get therapists
    const { data: terapeutas, error: terapeutasError } = await query

    if (terapeutasError) {
        console.error('Error fetching therapists:', terapeutasError)
        throw new Error('Erro ao buscar terapeutas: ' + (terapeutasError.message || JSON.stringify(terapeutasError)))
    }

    // Get curriculum for each therapist
    const terapeutasWithCurriculo = await Promise.all(
        (terapeutas || []).map(async (terapeuta) => {
            const { data: curriculo } = await supabase
                .from('terapeutas_curriculo')
                .select('*')
                .eq('id_usuario', terapeuta.id)
                .maybeSingle()

            return {
                ...terapeuta,
                terapeutas_curriculo: curriculo ? [curriculo] : []
            }
        })
    )

    return {
        terapeutas: terapeutasWithCurriculo,
        max_terapeutas: clinicData.max_terapeutas,
        total_terapeutas: terapeutasWithCurriculo.length,
        clinic_id: clinicId
    }
}

export async function createTerapeuta(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    // Get user's clinic
    const { data: userData } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userData?.id_clinica) {
        throw new Error('Usuário não vinculado a uma clínica')
    }

    const clinicId = userData.id_clinica

    // Check limits
    const { data: clinicData } = await supabase
        .from('saas_clinicas')
        .select('max_terapeutas')
        .eq('id', clinicId)
        .single()

    const { count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('id_clinica', clinicId)
        .eq('tipo_perfil', 'terapeuta')

    if (clinicData && count !== null && count >= clinicData.max_terapeutas) {
        throw new Error('Limite de terapeutas atingido')
    }

    const rawData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        cpf: formData.get('cpf'),
        celular: formData.get('celular'),
        registro_profissional: formData.get('registro_profissional'),
        formacao: formData.get('formacao'),
        especialidades: formData.get('especialidades'),
        publico_alvo: formData.get('publico_alvo'),
        bio: formData.get('bio'),
        tecnicas_preferidas: formData.get('tecnicas_preferidas'),
        recursos_preferidos: formData.get('recursos_preferidos'),
        estilo_conducao: formData.get('estilo_conducao'),
        observacoes_clinicas: formData.get('observacoes_clinicas'),
        valor_hora_padrao: formData.get('valor_hora_padrao'),
        porcentagem_repasse: formData.get('porcentagem_repasse'),
        chave_pix: formData.get('chave_pix'),
    }

    const validated = TerapeutaSchema.parse(rawData)

    // Handle Photo Upload
    const fotoFile = formData.get('foto') as File
    let fotoUrl = null

    if (fotoFile && fotoFile.size > 0) {
        const fileExt = fotoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('terapeutas-fotos')
            .upload(filePath, fotoFile)

        if (uploadError) {
            console.error('Error uploading photo:', uploadError)
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('terapeutas-fotos')
                .getPublicUrl(filePath)
            fotoUrl = publicUrl
        }
    }

    // Import admin client
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: validated.email,
        password: 'Tirilo2025!',
        email_confirm: true,
        user_metadata: {
            nome: validated.nome,
            id_clinica: clinicId,
            tipo_perfil: 'terapeuta'
        }
    })

    if (authError) {
        console.error('Error creating auth user:', authError)
        throw new Error('Erro ao criar usuário no Auth: ' + authError.message)
    }

    if (!authUser.user) {
        throw new Error('Erro inesperado: Usuário não criado.')
    }

    // 2. Insert into usuarios table
    const { error: userInsertError } = await supabase
        .from('usuarios')
        .insert({
            id: authUser.user.id,
            email: validated.email,
            nome_completo: validated.nome,
            cpf: validated.cpf || null,
            celular_whatsapp: validated.celular || null,
            tipo_perfil: 'terapeuta',
            id_clinica: clinicId,
            foto_url: fotoUrl
        })

    if (userInsertError) {
        console.error('Error creating user:', userInsertError)
        // Rollback auth user
        try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        } catch (rollbackError) {
            console.error('Failed to rollback auth user:', rollbackError)
        }
        throw new Error('Erro ao criar usuário: ' + userInsertError.message)
    }

    // 3. Create Curriculum
    const { error: curriculoError } = await supabase
        .from('terapeutas_curriculo')
        .insert({
            id_usuario: authUser.user.id,
            id_clinica: clinicId,
            registro_profissional: validated.registro_profissional || null,
            formacao: validated.formacao || null,
            especialidades: validated.especialidades ? (validated.especialidades as string).split(',').map(s => s.trim()) : null,
            publico_alvo: validated.publico_alvo ? (validated.publico_alvo as string).split(',').map(s => s.trim()) : null,
            bio: validated.bio || null,
            tecnicas_preferidas: validated.tecnicas_preferidas || null,
            recursos_preferidos: validated.recursos_preferidos || null,
            estilo_conducao: validated.estilo_conducao || null,
            observacoes_clinicas: validated.observacoes_clinicas || null,
            valor_hora_padrao: validated.valor_hora_padrao ? Number(validated.valor_hora_padrao) : null,
            porcentagem_repasse: validated.porcentagem_repasse ? Number(validated.porcentagem_repasse) : null,
            chave_pix: validated.chave_pix || null,
        })

    if (curriculoError) {
        console.error('Error creating curriculum:', curriculoError)
        throw new Error('Erro ao criar currículo: ' + curriculoError.message)
    }

    revalidatePath('/admin/terapeutas')
    revalidatePath('/admin/terapeutas')
    return { success: true }
}

export async function updateTerapeuta(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    const terapeutaId = formData.get('id') as string

    const rawData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        cpf: formData.get('cpf'),
        celular: formData.get('celular'),
        registro_profissional: formData.get('registro_profissional'),
        formacao: formData.get('formacao'),
        especialidades: formData.get('especialidades'),
        publico_alvo: formData.get('publico_alvo'),
        bio: formData.get('bio'),
        tecnicas_preferidas: formData.get('tecnicas_preferidas'),
        recursos_preferidos: formData.get('recursos_preferidos'),
        estilo_conducao: formData.get('estilo_conducao'),
        observacoes_clinicas: formData.get('observacoes_clinicas'),
        valor_hora_padrao: formData.get('valor_hora_padrao'),
        porcentagem_repasse: formData.get('porcentagem_repasse'),
        chave_pix: formData.get('chave_pix'),
    }

    const validated = TerapeutaSchema.parse(rawData)

    // Handle Photo Upload
    const fotoFile = formData.get('foto') as File
    let fotoUrl = null

    if (fotoFile && fotoFile.size > 0) {
        const fileExt = fotoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('terapeutas-fotos')
            .upload(filePath, fotoFile)

        if (uploadError) {
            console.error('Error uploading photo:', uploadError)
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('terapeutas-fotos')
                .getPublicUrl(filePath)
            fotoUrl = publicUrl
        }
    }

    // Update usuarios table
    const updateData: any = {
        nome_completo: validated.nome,
        email: validated.email,
        cpf: validated.cpf || null,
        celular_whatsapp: validated.celular || null,
    }

    if (fotoUrl) {
        updateData.foto_url = fotoUrl
    }

    const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', terapeutaId)

    if (userUpdateError) {
        console.error('Error updating user:', userUpdateError)
        throw new Error('Erro ao atualizar usuário: ' + userUpdateError.message)
    }

    // Update or insert curriculum
    const curriculoData = {
        registro_profissional: validated.registro_profissional || null,
        formacao: validated.formacao || null,
        especialidades: validated.especialidades ? (validated.especialidades as string).split(',').map(s => s.trim()) : null,
        publico_alvo: validated.publico_alvo ? (validated.publico_alvo as string).split(',').map(s => s.trim()) : null,
        bio: validated.bio || null,
        tecnicas_preferidas: validated.tecnicas_preferidas || null,
        recursos_preferidos: validated.recursos_preferidos || null,
        estilo_conducao: validated.estilo_conducao || null,
        observacoes_clinicas: validated.observacoes_clinicas || null,
        valor_hora_padrao: validated.valor_hora_padrao ? Number(validated.valor_hora_padrao) : null,
        porcentagem_repasse: validated.porcentagem_repasse ? Number(validated.porcentagem_repasse) : null,
        chave_pix: validated.chave_pix || null,
    }

    // Check if curriculum exists
    const { data: existingCurriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('id')
        .eq('id_usuario', terapeutaId)
        .maybeSingle()

    if (existingCurriculo) {
        // Update existing curriculum
        const { error: curriculoError } = await supabase
            .from('terapeutas_curriculo')
            .update(curriculoData)
            .eq('id_usuario', terapeutaId)

        if (curriculoError) {
            console.error('Error updating curriculum:', curriculoError)
            throw new Error('Erro ao atualizar currículo: ' + curriculoError.message)
        }
    } else {
        // Insert new curriculum
        const { data: userData } = await supabase
            .from('usuarios')
            .select('id_clinica')
            .eq('id', terapeutaId)
            .single()

        const { error: curriculoError } = await supabase
            .from('terapeutas_curriculo')
            .insert({
                id_usuario: terapeutaId,
                id_clinica: userData?.id_clinica || 0,
                ...curriculoData
            })

        if (curriculoError) {
            console.error('Error creating curriculum:', curriculoError)
            throw new Error('Erro ao criar currículo: ' + curriculoError.message)
        }
    }

    revalidatePath('/admin/terapeutas')
    revalidatePath(`/admin/terapeutas/${terapeutaId}`)
    revalidatePath('/admin/terapeutas')
    revalidatePath(`/admin/terapeutas/${terapeutaId}`)
    return { success: true }
}

export type Terapeuta = {
    id: string
    nome_completo: string
    email: string
    foto_url: string | null
    terapeutas_curriculo: any[]
    // Add other fields as needed
    nome: string // Alias for nome_completo if used in UI
}

export async function getClinicaLimit() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userData?.id_clinica) return null

    const { data: clinicData } = await supabase
        .from('saas_clinicas')
        .select('max_terapeutas')
        .eq('id', userData.id_clinica)
        .single()

    return clinicData?.max_terapeutas || 0
}
