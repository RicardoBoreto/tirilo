'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Recurso = {
    id: number
    created_at: string
    id_clinica: number
    nome_item: string
    foto_url: string | null
    localizacao: string | null
    quantidade: number
    objetivos_terapeuticos: string[] | null
    status_conservacao: 'Excelente' | 'Bom' | 'Necessita reparo' | 'Fora de uso'
}

export async function getRecursos() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get user's clinic
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return []

    const { data, error } = await supabase
        .from('recursos')
        .select('*')
        .eq('id_clinica', userProfile.id_clinica)
        .order('nome_item', { ascending: true })

    if (error) {
        if (error) {
            console.error('Erro ao buscar recursos:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            })
            return []
        }
        return []
    }

    return data as Recurso[]
}

export async function createRecurso(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) throw new Error('Usuário sem clínica vinculada')

    const objetivos = formData.get('objetivos_terapeuticos')?.toString().split(',').filter(Boolean) || []

    const recursoData = {
        id_clinica: userProfile.id_clinica,
        nome_item: formData.get('nome_item') as string,
        foto_url: formData.get('foto_url') as string || null,
        localizacao: formData.get('localizacao') as string || null,
        quantidade: Number(formData.get('quantidade')),
        objetivos_terapeuticos: objetivos,
        status_conservacao: formData.get('status_conservacao') as string,
    }

    const { error } = await supabase
        .from('recursos')
        .insert(recursoData)

    if (error) {
        console.error('Erro ao criar recurso:', error)
        throw new Error('Erro ao criar recurso')
    }

    revalidatePath('/admin/recursos')
}

export async function updateRecurso(id: number, formData: FormData) {
    const supabase = await createClient()

    const objetivos = formData.get('objetivos_terapeuticos')?.toString().split(',').filter(Boolean) || []

    const recursoData = {
        nome_item: formData.get('nome_item') as string,
        foto_url: formData.get('foto_url') as string || null,
        localizacao: formData.get('localizacao') as string || null,
        quantidade: Number(formData.get('quantidade')),
        objetivos_terapeuticos: objetivos,
        status_conservacao: formData.get('status_conservacao') as string,
    }

    const { error } = await supabase
        .from('recursos')
        .update(recursoData)
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar recurso:', error)
        throw new Error('Erro ao atualizar recurso')
    }

    revalidatePath('/admin/recursos')
}

export async function deleteRecurso(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('recursos')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar recurso:', error)
        throw new Error('Erro ao deletar recurso')
    }

    revalidatePath('/admin/recursos')
}

export async function uploadRecursoFoto(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) throw new Error('Nenhum arquivo enviado')

    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`

    const { data, error } = await supabase.storage
        .from('recursos')
        .upload(fileName, file)

    if (error) {
        console.error('Erro no upload:', error)
        throw new Error('Erro ao fazer upload da imagem')
    }

    const { data: { publicUrl } } = supabase.storage
        .from('recursos')
        .getPublicUrl(fileName)

    return publicUrl
}
