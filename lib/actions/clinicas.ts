'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getClinica(id: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_clinicas')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Erro ao buscar clínica:', error)
        return null
    }

    return data
}

export async function uploadLogo(formData: FormData) {
    const supabase = await createClient()

    const file = formData.get('file') as File
    const clinicaId = formData.get('clinica_id') as string

    if (!file || !clinicaId) {
        throw new Error('Arquivo ou ID da clínica faltando')
    }

    // Sanitizar nome
    const fileExt = file.name.split('.').pop()
    const fileName = `${clinicaId}/logo_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true })

    if (uploadError) {
        console.error('Erro upload logo:', uploadError)
        throw new Error('Erro ao fazer upload do logo')
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

    // Update Clinic
    const { error: dbError } = await supabase
        .from('saas_clinicas')
        .update({ logo_url: publicUrl })
        .eq('id', parseInt(clinicaId))

    if (dbError) {
        throw new Error('Erro ao atualizar URL do logo na clínica')
    }


    revalidatePath(`/admin/clinicas/${clinicaId}`)
    revalidatePath(`/clinica/${clinicaId}`)

    return publicUrl
}

export async function getAllClinics() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_clinicas')
        .select('id, nome_fantasia')
        .order('nome_fantasia')

    if (error) {
        console.error('Erro ao buscar clínicas:', error)
        return []
    }

    return data
}
