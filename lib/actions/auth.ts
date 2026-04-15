'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        console.error('Erro ao atualizar senha:', error)
        throw new Error(error.message)
    }

    // Update the flag in the database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase
            .from('usuarios')
            .update({ precisa_trocar_senha: false })
            .eq('id', user.id)
    }

    redirect('/admin/pacientes')
}

export async function resetUserPasswordAdmin(userId: string, password: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) throw new Error('Acesso negado')

    // Verificação de segurança: seguindo o padrão do layout, Super Admin é quem não tem id_clinica.
    const { data: profile } = await supabase
        .from('usuarios')
        .select('tipo_perfil, id_clinica')
        .eq('id', currentUser.id)
        .maybeSingle()

    // Definição de Permissão:
    // 1. Super Admin Global: id_clinica é nulo (ou perfil não existe)
    // 2. Administrador da Clínica: tipo_perfil é 'admin' e possui id_clinica
    const isSuperAdmin = !profile?.id_clinica;
    const isClinicAdmin = profile?.tipo_perfil === 'admin' && profile?.id_clinica !== null;

    if (!isSuperAdmin && !isClinicAdmin) {
        throw new Error(`Permissão insuficiente. Seu perfil (${profile?.tipo_perfil || 'Desconhecido'}) não tem autorização para redefinir senhas da equipe.`)
    }

    // Validação de senha: 6 chars, 1 maiúscula, 1 número, 1 símbolo
    if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.')
    if (!/[A-Z]/.test(password)) throw new Error('A senha deve conter pelo menos uma letra maiúscula.')
    if (!/[0-9]/.test(password)) throw new Error('A senha deve conter pelo menos um número.')
    if (!/[!@#$%^&*(),?":{}|<>]/.test(password)) throw new Error('A senha deve conter pelo menos um caractere especial.')

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
    })

    if (authError) {
        console.error('Erro ao resetar senha via Auth Admin:', authError)
        throw new Error(authError.message)
    }

    // Marcar que o usuário precisa trocar a senha no próximo acesso
    await supabase
        .from('usuarios')
        .update({ precisa_trocar_senha: true })
        .eq('id', userId)

    return { success: true, message: 'Senha alterada com sucesso! O usuário deverá obrigatoriamente trocá-la no próximo acesso.' }
}

