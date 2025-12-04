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
