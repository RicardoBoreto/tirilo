'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SaasEmpresaSchema = z.object({
    razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
    nome_fantasia: z.string().optional(),
    cnpj: z.string().optional(),
    inscricao_estadual: z.string().optional(),
    inscricao_municipal: z.string().optional(),
    // Address
    end_cep: z.string().optional(),
    end_logradouro: z.string().optional(),
    end_numero: z.string().optional(),
    end_complemento: z.string().optional(),
    end_bairro: z.string().optional(),
    end_cidade: z.string().optional(),
    end_estado: z.string().optional(),
    // Contact
    telefone: z.string().optional(),
    email_contato: z.string().email('Email inválido').optional().or(z.literal('')),
    site_url: z.string().url('URL inválida').optional().or(z.literal('')),
    logo_url: z.string().optional()
})

export async function getSaasEmpresa() {
    const supabase = await createClient()

    // Attempt to get the first record
    const { data, error } = await supabase
        .from('saas_empresa')
        .select('*')
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching SAAS empresa:', error)
    }

    return data
}

export async function updateSaasEmpresa(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        razao_social: formData.get('razao_social'),
        nome_fantasia: formData.get('nome_fantasia'),
        cnpj: formData.get('cnpj'),
        inscricao_estadual: formData.get('inscricao_estadual'),
        inscricao_municipal: formData.get('inscricao_municipal'),
        end_cep: formData.get('end_cep'),
        end_logradouro: formData.get('end_logradouro'),
        end_numero: formData.get('end_numero'),
        end_complemento: formData.get('end_complemento'),
        end_bairro: formData.get('end_bairro'),
        end_cidade: formData.get('end_cidade'),
        end_estado: formData.get('end_estado'),
        telefone: formData.get('telefone'),
        email_contato: formData.get('email_contato'),
        site_url: formData.get('site_url'),
    }

    const validated = SaasEmpresaSchema.parse(rawData)

    // Check if record exists
    const existing = await getSaasEmpresa()

    let error

    if (existing) {
        const { error: updateError } = await supabase
            .from('saas_empresa')
            .update({
                ...validated,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('saas_empresa')
            .insert({
                ...validated,
            })
        error = insertError
    }

    if (error) {
        console.error('Error updating SAAS empresa:', error)
        throw new Error(`Erro ao salvar configurações da empresa: ${error.message}`)
    }

    revalidatePath('/admin/configuracoes-saas')
    return { success: true }
}

export async function uploadSaasLogo(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
        throw new Error('Nenhum arquivo enviado')
    }

    // Use a specific public bucket or creating a folder in 'public-assets' if available
    // Assuming 'logos' bucket is available and public
    const fileExt = file.name.split('.').pop()
    const fileName = `saas-logo-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Try uploading to 'logos' bucket first (used for clinics)
    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        throw new Error('Erro ao fazer upload da logo')
    }

    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

    // Update the record with the new logo URL
    const existing = await getSaasEmpresa()
    if (existing) {
        await supabase
            .from('saas_empresa')
            .update({ logo_url: publicUrl })
            .eq('id', existing.id)
    } else {
        // Create initial record just with logo? Maybe risky. 
        // Better to require the user to save the form. 
        // For now, just return the URL so the form can use it.
    }

    return publicUrl
}
