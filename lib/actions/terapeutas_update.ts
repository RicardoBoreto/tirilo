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
})

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
    redirect(`/admin/terapeutas/${terapeutaId}`)
}

// ... rest of the file (getTerapeutas and createTerapeuta remain unchanged)
