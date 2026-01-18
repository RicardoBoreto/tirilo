'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Operadora = {
    id: number
    clinica_id: number
    nome_fantasia: string
    razao_social: string | null
    cnpj: string | null
    registro_ans: string | null
    prazo_pagamento_dias: number | null
    ativo: boolean
    created_at: string
}

async function getClinicaId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: usuario } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!usuario?.id_clinica) throw new Error('Usuário sem clínica vinculada')
    return usuario.id_clinica
}

export async function getOperadoras() {
    const supabase = await createClient()
    const clinicaId = await getClinicaId()

    const { data, error } = await supabase
        .from('saas_operadoras')
        .select('*')
        .eq('clinica_id', clinicaId)
        .eq('ativo', true)
        .order('nome_fantasia')

    if (error) {
        console.error('Erro ao buscar operadoras:', error)
        return []
    }

    return data as Operadora[]
}

export async function getOperadora(id: number) {
    const supabase = await createClient()
    // Validar clínica (RLS deve garantir, mas reforçamos)
    const clinicaId = await getClinicaId()

    const { data, error } = await supabase
        .from('saas_operadoras')
        .select('*')
        .eq('id', id)
        .eq('clinica_id', clinicaId)
        .single()

    if (error) return null
    return data as Operadora
}

export async function saveOperadora(formData: FormData) {
    const supabase = await createClient()
    const clinicaId = await getClinicaId()

    const id = formData.get('id') ? Number(formData.get('id')) : null

    const data = {
        clinica_id: clinicaId,
        nome_fantasia: formData.get('nome_fantasia') as string,
        razao_social: formData.get('razao_social') as string || null,
        cnpj: (formData.get('cnpj') as string)?.replace(/\D/g, '') || null,
        registro_ans: formData.get('registro_ans') as string || null,
        prazo_pagamento_dias: formData.get('prazo_pagamento_dias') ? Number(formData.get('prazo_pagamento_dias')) : 30,
        ativo: true
    }

    let error
    if (id) {
        const { error: updateError } = await supabase
            .from('saas_operadoras')
            .update(data)
            .eq('id', id)
            .eq('clinica_id', clinicaId)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('saas_operadoras')
            .insert(data)
        error = insertError
    }

    if (error) {
        console.error('Erro ao salvar operadora:', error)
        throw new Error('Erro ao salvar operadora')
    }

    revalidatePath('/admin/configuracoes')
    revalidatePath('/admin/pacientes') // Para atualizar selects
}

export async function deleteOperadora(id: number) {
    const supabase = await createClient()
    const clinicaId = await getClinicaId()

    // Soft delete
    const { error } = await supabase
        .from('saas_operadoras')
        .update({ ativo: false })
        .eq('id', id)
        .eq('clinica_id', clinicaId)

    if (error) {
        console.error('Erro ao deletar operadora:', error)
        throw new Error('Erro ao deletar operadora')
    }

    revalidatePath('/admin/configuracoes')
}
