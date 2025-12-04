import TerapeutaForm from '@/components/TerapeutaForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NovoTerapeutaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: currentUser } = await supabase
        .from('usuarios')
        .select('tipo_perfil')
        .eq('id', user.id)
        .single()

    if (currentUser?.tipo_perfil === 'terapeuta') {
        redirect('/admin/terapeutas')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Novo Terapeuta
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Cadastre um novo profissional na sua equipe
                </p>
            </div>

            <TerapeutaForm />
        </div>
    )
}
