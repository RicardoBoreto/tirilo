'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfigSaasForm from './ConfigSaasForm' // We will create this client component

export default async function ConfigSaasPage() {
    const supabase = await createClient()

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 2. Check Permissions
    const { data: userData } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = userData?.tipo_perfil === 'super_admin' || userData?.tipo_perfil === 'master_admin'

    // If not super admin/master admin, redirect away
    // We allow clinic users if they are master_admin (though usually master_admin is for the SaaS owner)
    // Adjust logic: Only strictly unauthorized users should be redirected.
    if (!isSuperAdmin && userData?.id_clinica) {
        redirect('/admin')
    }

    // 3. Get Data
    const { data: empresa } = await supabase
        .from('saas_empresa')
        .select('*')
        .limit(1)
        .single()

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Configurações da Empresa (SaaS)
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Dados da empresa proprietária do software para emissão de notas fiscais.
                </p>
            </div>

            <ConfigSaasForm initialData={empresa} />
        </div>
    )
}
