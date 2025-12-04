'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ClinicaSchema = z.object({
    nome_fantasia: z.string().min(3, 'Nome fantasia deve ter pelo menos 3 caracteres'),
    razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
    config_cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
})

export async function updateClinica(formData: FormData) {
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

    const rawData = {
        nome_fantasia: formData.get('nome_fantasia'),
        razao_social: formData.get('razao_social'),
        config_cor_primaria: formData.get('config_cor_primaria'),
    }

    const validated = ClinicaSchema.parse(rawData)

    // Handle Logo Upload
    const logoFile = formData.get('logo') as File
    let logoUrl = null

    if (logoFile && logoFile.size > 0) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${clinicId}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('clinicas-logos')
            .upload(filePath, logoFile, { upsert: true })

        if (uploadError) {
            console.error('Error uploading logo:', uploadError)
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('clinicas-logos')
                .getPublicUrl(filePath)
            logoUrl = publicUrl
        }
    }

    const updateData: any = {
        nome_fantasia: validated.nome_fantasia,
        razao_social: validated.razao_social,
        config_cor_primaria: validated.config_cor_primaria,
    }

    if (logoUrl) {
        updateData.logo_url = logoUrl
    }

    const { error } = await supabase
        .from('saas_clinicas')
        .update(updateData)
        .eq('id', clinicId)

    if (error) {
        throw new Error('Erro ao atualizar clínica')
    }

    revalidatePath('/admin')
    redirect('/admin/configuracoes')
}

export async function getClinica() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    const { data: userData } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userData?.id_clinica) {
        return null
    }

    const { data: clinic } = await supabase
        .from('saas_clinicas')
        .select('*')
        .eq('id', userData.id_clinica)
        .single()

    return clinic
}
