'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GameVersion = {
    id: string
    jogo_id: string
    versao: string
    notas_atualizacao: string | null
    criado_em: string
}

export type Game = {
    id: string
    nome: string
    descricao_regras: string | null
    indicacao: string | null
    thumbnail_url: string | null
    ativo: boolean
    categoria: string | null
    comando_entrada: string | null
    versao_atual: string
    preco: number
    criado_em: string
    atualizado_em: string
}

async function uploadThumbnail(file: File): Promise<string | null> {
    const supabase = await createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `jogos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase.storage
        .from('fotos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        })

    if (error) {
        console.error('Error uploading thumbnail:', error)
        return null
    }

    const { data: { publicUrl } } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)

    return publicUrl
}

export async function getGames() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_jogos')
        .select('*')
        .order('nome', { ascending: true })

    if (error) {
        console.error('Error fetching games:', error)
        return []
    }

    return data.map((g: any) => ({
        ...g,
        versao_atual: g.versao_atual || '1.0',
        preco: g.preco || 0
    })) as Game[]
}

export async function getGameVersions(gameId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saas_jogos_versoes')
        .select('*')
        .eq('jogo_id', gameId)
        .order('criado_em', { ascending: false })

    if (error) {
        console.error('Error fetching game versions:', error)
        return []
    }

    return data as GameVersion[]
}

export async function createGame(formData: FormData) {
    const supabase = await createClient()

    const nome = formData.get('nome') as string
    const descricao_regras = formData.get('descricao_regras') as string
    const indicacao = formData.get('indicacao') as string
    const categoria = formData.get('categoria') as string
    const comando_entrada = formData.get('comando_entrada') as string
    const ativo = formData.get('ativo') === 'true'
    const preco = parseFloat(formData.get('preco') as string || '0')
    const versao_inicial = formData.get('versao') as string || '1.0'
    const notas_iniciais = 'Criação inicial do jogo.'

    const thumbnailFile = formData.get('thumbnail') as File | null
    let thumbnail_url = formData.get('thumbnail_url') as string

    if (thumbnailFile && thumbnailFile.size > 0) {
        const uploadedUrl = await uploadThumbnail(thumbnailFile)
        if (uploadedUrl) {
            thumbnail_url = uploadedUrl
        }
    }

    const { data: game, error } = await supabase
        .from('saas_jogos')
        .insert({
            nome,
            descricao_regras,
            indicacao,
            categoria,
            comando_entrada,
            thumbnail_url,
            ativo,
            preco,
            versao_atual: versao_inicial
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    if (game) {
        await supabase.from('saas_jogos_versoes').insert({
            jogo_id: game.id,
            versao: versao_inicial,
            notas_atualizacao: notas_iniciais
        })
    }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export async function updateGame(id: string, formData: FormData) {
    const supabase = await createClient()

    const nome = formData.get('nome') as string
    const descricao_regras = formData.get('descricao_regras') as string
    const indicacao = formData.get('indicacao') as string
    const categoria = formData.get('categoria') as string
    const comando_entrada = formData.get('comando_entrada') as string
    const ativo = formData.get('ativo') === 'true'
    const preco = parseFloat(formData.get('preco') as string || '0')

    const nova_versao = formData.get('nova_versao') as string
    const notas_versao = formData.get('notas_versao') as string

    const thumbnailFile = formData.get('thumbnail') as File | null
    let thumbnail_url = formData.get('thumbnail_url') as string

    if (thumbnailFile && thumbnailFile.size > 0) {
        const uploadedUrl = await uploadThumbnail(thumbnailFile)
        if (uploadedUrl) {
            thumbnail_url = uploadedUrl
        }
    }

    const updateData: any = {
        nome,
        descricao_regras,
        indicacao,
        categoria,
        comando_entrada,
        ativo,
        preco,
        atualizado_em: new Date().toISOString()
    }

    if (thumbnail_url) {
        updateData.thumbnail_url = thumbnail_url
    }

    if (nova_versao) {
        updateData.versao_atual = nova_versao
    }

    const { error } = await supabase
        .from('saas_jogos')
        .update(updateData)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    if (nova_versao) {
        await supabase.from('saas_jogos_versoes').insert({
            jogo_id: id,
            versao: nova_versao,
            notas_atualizacao: notas_versao || 'Atualização de versão.'
        })
    }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export async function toggleGameStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('saas_jogos')
        .update({ ativo: !currentStatus })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export async function deleteGame(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('saas_jogos')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/jogos')
    return { success: true }
}

export type ClinicPermission = {
    clinica_id: string
    nome_clinica: string
    tem_acesso: boolean
}

export async function getGamePermissions(gameId: string): Promise<ClinicPermission[]> {
    const supabase = await createClient()

    // Get all clinics
    const { data: clinics, error: clinicsError } = await supabase
        .from('saas_clinicas')
        .select('id, nome_fantasia')
        .order('nome_fantasia')

    if (clinicsError) {
        console.error('Error fetching clinics:', clinicsError)
        return []
    }

    // Get existing permissions
    const { data: permissions, error: permsError } = await supabase
        .from('saas_clinicas_jogos')
        .select('clinica_id')
        .eq('jogo_id', gameId)
        .eq('ativo', true)

    if (permsError) {
        console.error('Error fetching permissions:', permsError)
        return []
    }

    const authorizedIds = new Set(permissions?.map(p => p.clinica_id) || [])

    return clinics.map(clinic => ({
        clinica_id: clinic.id,
        nome_clinica: clinic.nome_fantasia,
        tem_acesso: authorizedIds.has(clinic.id)
    }))
}

export async function updateGamePermission(gameId: string, clinicId: string, grant: boolean) {
    const supabase = await createClient()

    if (grant) {
        // Upsert to grant access
        const { error } = await supabase
            .from('saas_clinicas_jogos')
            .upsert({
                jogo_id: gameId,
                clinica_id: clinicId,
                ativo: true,
                data_aquisicao: new Date().toISOString()
            }, { onConflict: 'clinica_id, jogo_id' })

        if (error) return { error: error.message }
    } else {
        // Soft delete or hard delete? Let's hard delete for simplicity or set ativo=false
        const { error } = await supabase
            .from('saas_clinicas_jogos')
            .update({ ativo: false })
            .match({ jogo_id: gameId, clinica_id: clinicId })

        // Alternatively delete:
        // .delete().match(...) 
        // But maintaining history might be good. Let's stick to update ativo=false.

        if (error) return { error: error.message }
    }

    revalidatePath('/admin/jogos')
    return { success: true }
}
