'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getMeusFilhos() {
    const supabase = await createClient()
    const adminDb = await createAdminClient()

    // 1. Get Logged User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return []
    }

    // 2. Get Responsavel ID (usando ID do usuário logado)
    const { data: responsavel, error: respError } = await adminDb
        .from('responsaveis')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (respError || !responsavel) {
        console.error('Responsável não encontrado para este usuário')
        return []
    }

    // 3. Get Pacientes linked to Responsavel
    const { data: vinculos, error: vincError } = await adminDb
        .from('pacientes_responsaveis')
        .select('paciente_id')
        .eq('responsavel_id', responsavel.id)

    if (vincError || !vinculos.length) {
        return []
    }

    const pacienteIds = vinculos.map(v => v.paciente_id)

    // 4. Get Pacientes Details + Anamnese (Musicoterapia) + Clinica
    const { data: pacientes, error: pacError } = await adminDb
        .from('pacientes')
        .select(`
            *,
            anamnese:pacientes_anamnese(musicoterapia),
            clinica:saas_clinicas(*)
        `)
        .in('id', pacienteIds)
        .eq('ativo', true)

    if (pacError) {
        console.error('Erro ao buscar pacientes:', pacError)
        return []
    }

    return pacientes
}

export async function enableResponsavelAccess(responsavelId: number, email: string, nome: string) {
    const supabase = await createClient()

    // Import admin client dynamically to avoid issues in client components if imported directly (though this is a server action)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    if (!email) {
        throw new Error('O responsável precisa ter um e-mail cadastrado para habilitar o acesso.')
    }

    // 1. Check if Auth User already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    // Better way to find user by email
    // const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email) // This might not be available in all versions, sticking to list or create

    let userId: string

    // Try to create user. If fails because exists, try to get ID.
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'Tirilo2025!',
        email_confirm: true,
        user_metadata: {
            nome: nome,
            tipo_perfil: 'responsavel'
        }
    })

    if (authError) {
        if (authError.message.includes('already been registered')) {
            // User exists, find their ID
            // We can't easily get the ID from the error. We need to fetch the user.
            // Since we are admin, we can list users or try to sign in (bad idea).
            // Let's use listUsers with filter if possible, or just iterate (not efficient but works for now)
            // Or better: we assume the user might be in our 'usuarios' table? No, responsibles are not there.
            // We can use listUsers.

            // Actually, supabaseAdmin.auth.admin.listUsers() is not ideal for finding one user.
            // But we can assume if they are registered, we might not want to reset their password.
            // However, we need their ID to link.

            // Let's try to get user by email
            // Note: supabase-js admin api has listUsers but not getUserByEmail directly in all versions?
            // It does have `listUsers` which returns a list.

            // Let's try a direct query if we can't get it easily.
            // But we can't query auth.users directly from client.

            // Workaround: If create fails, we assume they have an account.
            // We need to link them.
            // If we can't get the ID, we can't link.

            // Let's try to fetch the user ID via a different method or just error out saying "User exists, please contact support" 
            // OR, we can try to find them in `usuarios` table? No.

            // Wait, if I use `supabaseAdmin.auth.admin.listUsers()`, I can filter?
            // No, listUsers doesn't support email filter in all versions.

            // Let's try to just update the responsible if we can find the user.
            // If we can't find the user ID, we are stuck.

            // Actually, `createUser` returns the user object even if it fails? No.

            throw new Error('Este e-mail já está registrado em outra conta. Por favor, verifique se o usuário já existe.')
        } else {
            throw new Error('Erro ao criar usuário: ' + authError.message)
        }
    } else {
        userId = authUser.user.id
    }

    // 2. Update Responsavel with user_id
    const { error: updateError } = await supabase
        .from('responsaveis')
        .update({ user_id: userId })
        .eq('id', responsavelId)

    if (updateError) {
        console.error('Erro ao vincular usuário ao responsável:', updateError)
        throw new Error('Erro ao vincular acesso.')
    }

    return { success: true, message: 'Acesso habilitado! Senha temporária: Tirilo2025!' }
}

export async function getAgendaPaciente(pacienteId: number) {
    const adminDb = await createAdminClient()

    const { data: agendamentos, error } = await adminDb
        .from('agendamentos')
        .select(`
            *,
            terapeuta:usuarios!id_terapeuta(nome_completo, foto_url)
        `)
        .eq('id_paciente', pacienteId)
        .order('data_hora_inicio', { ascending: true })

    if (error) {
        console.error('Erro ao buscar agenda:', error)
        return []
    }

    return agendamentos
}

export async function updateResponsavelPassword(responsavelId: number, newPassword: string) {
    const supabase = await createClient()
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // 1. Get user_id from responsavel
    const { data: responsavel, error: respError } = await supabase
        .from('responsaveis')
        .select('user_id')
        .eq('id', responsavelId)
        .single()

    if (respError || !responsavel) {
        throw new Error('Responsável não encontrado.')
    }

    if (!responsavel.user_id) {
        throw new Error('Este responsável não tem acesso habilitado.')
    }

    // 2. Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        responsavel.user_id,
        { password: newPassword }
    )

    if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        throw new Error('Erro ao atualizar senha: ' + updateError.message)
    }

    return { success: true, message: 'Senha atualizada com sucesso.' }
}

export async function unlinkResponsavelAccess(responsavelId: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('responsaveis')
        .update({ user_id: null })
        .eq('id', responsavelId)

    if (error) {
        console.error('Erro ao desvincular acesso:', error)
        throw new Error('Erro ao desvincular acesso.')
    }
    return { success: true, message: 'Acesso desvinculado. Agora você pode habilitar novamente.' }
}

export async function getRelatoriosPacienteFamilia(pacienteId: number) {
    const supabase = await createClient()

    // 1. Get Logged User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 2. Check Permission (Responsavel -> Paciente)
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminDb = await createAdminClient()

    const { data: responsavel } = await adminDb
        .from('responsaveis')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!responsavel) return []

    const { data: vinculo } = await adminDb
        .from('pacientes_responsaveis')
        .select('*')
        .eq('responsavel_id', responsavel.id)
        .eq('paciente_id', pacienteId)
        .single()

    if (!vinculo) return []

    // 3. Get Relatorios Visible
    const { data: relatorios, error } = await adminDb
        .from('relatorios_atendimento')
        .select(`
            *,
            terapeuta:usuarios(nome_completo),
            agendamento:agendamentos(data_hora_inicio)
        `)
        .eq('id_paciente', pacienteId)
        .eq('visivel_familia', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar relatórios família:', error)
        return []
    }

    return relatorios
}
