'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const nome = formData.get('nome') as string
    const email = formData.get('email') as string
    const cpf = formData.get('cpf') as string
    const celular = formData.get('celular') as string
    const tipo_perfil = formData.get('tipo_perfil') as string
    const id_clinica = formData.get('id_clinica') as string

    if (!nome || !email || !celular || !tipo_perfil || !id_clinica) {
        throw new Error('Campos obrigatórios faltando.')
    }

    // Check if user already exists in usuarios table
    const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('email', email)
        .single()

    if (existingUser) {
        throw new Error('Este email já está cadastrado no sistema.')
    }

    // 1. Create Auth User (Admin API)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'Tirilo2025!',
        email_confirm: true,
        user_metadata: {
            nome: nome,
            id_clinica: parseInt(id_clinica),
            tipo_perfil: tipo_perfil
        }
    })

    if (authError) {
        console.error('Error creating auth user:', authError)

        // Provide user-friendly error messages
        if (authError.message.includes('already been registered')) {
            throw new Error('Este email já está cadastrado no sistema.')
        }

        throw new Error('Erro ao criar usuário: ' + authError.message)
    }

    if (!authUser.user) {
        throw new Error('Erro inesperado: Usuário não criado.')
    }

    // 2. Insert into public.usuarios
    const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
            id: authUser.user.id,
            nome_completo: nome,
            email: email,
            cpf: cpf || null,
            celular_whatsapp: celular,
            tipo_perfil: tipo_perfil,
            id_clinica: parseInt(id_clinica),
            precisa_trocar_senha: true,
            created_at: new Date().toISOString(),
        })

    if (dbError) {
        console.error('Error inserting user:', dbError)
        // Try to rollback auth user creation
        try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        } catch (rollbackError) {
            console.error('Failed to rollback auth user:', rollbackError)
        }
        throw new Error('Erro ao criar usuário no banco de dados: ' + dbError.message)
    }

    revalidatePath(`/admin/clinicas/${id_clinica}/editar`)
    return { success: true, message: 'Convite enviado! Senha temporária: Tirilo2025!' }
}

