import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditTerapeutaForm from '@/components/EditTerapeutaForm'

export default async function EditTerapeutaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: terapeuta, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .eq('tipo_perfil', 'terapeuta')
        .single()

    if (error || !terapeuta) {
        notFound()
    }

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: currentUser } = await supabase
            .from('usuarios')
            .select('tipo_perfil')
            .eq('id', user.id)
            .single()

        if (currentUser?.tipo_perfil === 'terapeuta' && user.id !== id) {
            // Therapist can only edit their own profile
            return (
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                    <p>Você só pode editar seu próprio perfil.</p>
                </div>
            )
        }
    }

    const { data: curriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .eq('id_usuario', id)
        .maybeSingle()

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Terapeuta
            </h1>

            <EditTerapeutaForm terapeuta={terapeuta} curriculo={curriculo} />

            {user?.id === id && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Segurança
                    </h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Senha de Acesso</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Recomendamos alterar sua senha periodicamente.
                            </p>
                        </div>
                        <a
                            href="/admin/trocar-senha"
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Alterar Senha
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
