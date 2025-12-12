'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ClinicaSchema = z.object({
    nome_fantasia: z.string().min(3, 'Nome fantasia deve ter pelo menos 3 caracteres'),
    razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
    config_cor_primaria: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
    cnpj: z.string().optional(),
    inscricao_estadual: z.string().optional(),
    endereco_completo: z.string().optional(),
    missao: z.string().optional(),
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
        cnpj: formData.get('cnpj'),
        inscricao_estadual: formData.get('inscricao_estadual'),
        missao: formData.get('missao'),
        // Address parts
        endereco_cep: formData.get('endereco_cep'),
        endereco_logradouro: formData.get('endereco_logradouro'),
        endereco_numero: formData.get('endereco_numero'),
        endereco_complemento: formData.get('endereco_complemento'),
        endereco_bairro: formData.get('endereco_bairro'),
        endereco_cidade: formData.get('endereco_cidade'),
        endereco_estado: formData.get('endereco_estado'),
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
        cnpj: validated.cnpj,
        inscricao_estadual: validated.inscricao_estadual,
        missao: validated.missao,

        // Address Cols
        end_cep: rawData.endereco_cep,
        end_logradouro: rawData.endereco_logradouro,
        end_numero: rawData.endereco_numero,
        end_complemento: rawData.endereco_complemento,
        end_bairro: rawData.endereco_bairro,
        end_cidade: rawData.endereco_cidade,
        end_estado: rawData.endereco_estado
    }

    if (logoUrl) {
        updateData.logo_url = logoUrl
    }

    const { error } = await supabase
        .from('saas_clinicas')
        .update(updateData)
        .eq('id', clinicId)

    if (error) {
        console.error('Supabase Update Error:', error)
        throw new Error(`Erro ao atualizar clínica: ${error.message || error.details || JSON.stringify(error)}`)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/configuracoes')
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
