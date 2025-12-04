'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Ticket = {
    id: number
    id_clinica: number
    id_usuario_criador: string
    assunto: string
    tipo: 'problema' | 'sugestao' | 'duvida' | 'financeiro' | 'outro'
    prioridade: 'baixa' | 'media' | 'alta' | 'critica'
    status: 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado'
    created_at: string
    updated_at: string
    usuario_criador?: {
        nome_completo: string
        email: string
    }
    clinica?: {
        nome_fantasia: string
    }
}

export type Mensagem = {
    id: number
    id_ticket: number
    id_usuario: string
    mensagem: string
    anexo_url: string | null
    anexo_nome: string | null
    anexo_tipo: string | null
    lida: boolean
    created_at: string
    usuario?: {
        nome: string
        tipo_perfil: string
    }
}

export async function createTicket(data: {
    assunto: string
    tipo: string
    prioridade: string
    mensagem_inicial: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    if (!userProfile?.id_clinica) return { error: 'Clínica não identificada' }

    // Check if user exists in 'usuarios' table
    const { data: userExists } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .single()

    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabase
        .from('help_desk_tickets')
        .insert({
            id_clinica: userProfile.id_clinica,
            id_usuario_criador: userExists ? user.id : null, // If Master Admin, set to NULL
            assunto: data.assunto,
            tipo: data.tipo,
            prioridade: data.prioridade,
            status: 'aberto'
        })
        .select()
        .single()

    if (ticketError) {
        console.error('Erro ao criar ticket:', ticketError)
        return { error: 'Erro ao criar ticket' }
    }

    // 2. Create Initial Message
    const { error: msgError } = await supabase
        .from('help_desk_mensagens')
        .insert({
            id_ticket: ticket.id,
            id_usuario: user.id,
            mensagem: data.mensagem_inicial
        })

    if (msgError) {
        console.error('Erro ao criar mensagem inicial:', msgError)
        // Note: Ticket was created but message failed. Ideally use transaction but simple flow is ok.
    }

    revalidatePath('/admin/help-desk')
    return { success: true, ticketId: ticket.id }
}

export async function getTickets() {
    const supabase = await createClient()

    // RLS will handle filtering (Admin sees all, Clinic sees theirs)
    const { data, error } = await supabase
        .from('help_desk_tickets')
        .select(`
            *,
            usuario_criador:usuarios(nome_completo, email),
            clinica:saas_clinicas(nome_fantasia)
        `)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar tickets:', error.message, error.code, error.details)
        return []
    }

    return data as Ticket[]
}

export async function getTicketDetails(ticketId: number) {
    const supabase = await createClient()

    // Fetch Ticket Info
    const { data: ticket, error: ticketError } = await supabase
        .from('help_desk_tickets')
        .select(`
            *,
            usuario_criador:usuarios(nome_completo, email),
            clinica:saas_clinicas(nome_fantasia)
        `)
        .eq('id', ticketId)
        .single()

    if (ticketError) return null

    // Fetch Messages
    const { data: mensagens, error: msgError } = await supabase
        .from('help_desk_mensagens')
        .select(`
            *,
            usuario:usuarios(nome, tipo_perfil)
        `)
        .eq('id_ticket', ticketId)
        .order('created_at', { ascending: true })

    return {
        ticket: ticket as Ticket,
        mensagens: (mensagens || []) as Mensagem[]
    }
}

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    const ticketId = Number(formData.get('ticketId'))
    const mensagem = formData.get('mensagem') as string
    const arquivo = formData.get('arquivo') as File | null

    let anexoUrl = null
    let anexoNome = null
    let anexoTipo = null

    // Upload file if present
    if (arquivo && arquivo.size > 0) {
        const fileExt = arquivo.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${ticketId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('help-desk-anexos')
            .upload(filePath, arquivo, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError)
            return { error: 'Erro ao fazer upload do arquivo' }
        }

        anexoUrl = filePath
        anexoNome = arquivo.name
        anexoTipo = arquivo.type
    }

    // Check if user exists in 'usuarios' table
    const { data: userExists } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .single()

    const { error } = await supabase
        .from('help_desk_mensagens')
        .insert({
            id_ticket: ticketId,
            id_usuario: userExists ? user.id : null,
            mensagem,
            anexo_url: anexoUrl,
            anexo_nome: anexoNome,
            anexo_tipo: anexoTipo
        })

    if (error) {
        console.error('Erro ao enviar mensagem:', error)
        return { error: 'Erro ao enviar mensagem' }
    }

    // Update ticket 'updated_at' to bump it to top
    await supabase
        .from('help_desk_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId)

    revalidatePath(`/admin/help-desk/${ticketId}`)
    return { success: true }
}

export async function updateTicketStatus(ticketId: number, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('help_desk_tickets')
        .update({ status })
        .eq('id', ticketId)

    if (error) return { error: 'Erro ao atualizar status' }

    revalidatePath(`/admin/help-desk/${ticketId}`)
    revalidatePath('/admin/help-desk')
    return { success: true }
}

export async function getAnexoSignedUrl(filePath: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.storage
        .from('help-desk-anexos')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
        console.error('Erro ao gerar URL:', error)
        return null
    }

    return data.signedUrl
}
