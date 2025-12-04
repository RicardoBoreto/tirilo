'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Sala = {
    id: number
    id_clinica: number
    nome: string
    descricao: string | null
    capacidade: number
    cor_identificacao: string
    ativa: boolean
}

export async function getSalas() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('salas_recursos')
        .select('*')
        .order('nome')

    if (error) {
        console.error('Erro ao buscar salas:', error)
        return []
    }

    return data as Sala[]
}

export async function createSala(data: Omit<Sala, 'id' | 'id_clinica' | 'ativa'>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return { error: 'Clínica não identificada' }

    const { error } = await supabase
        .from('salas_recursos')
        .insert({
            id_clinica: userProfile.id_clinica,
            ...data
        })

    if (error) {
        console.error('Erro ao criar sala:', error)
        return { error: 'Erro ao criar sala' }
    }

    revalidatePath('/admin/salas')
    return { success: true }
}

export async function updateSala(id: number, data: Partial<Sala>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('salas_recursos')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar sala:', error)
        return { error: 'Erro ao atualizar sala' }
    }

    revalidatePath('/admin/salas')
    return { success: true }
}

export async function deleteSala(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('salas_recursos')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao excluir sala:', error)
        return { error: 'Erro ao excluir sala' }
    }

    revalidatePath('/admin/salas')
    return { success: true }
}
