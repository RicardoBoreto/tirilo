import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RobotDashboard from '@/components/robo/RobotDashboard'

export const metadata = {
    title: 'Robôs Tirilo | SaaS Tirilo',
    description: 'Gestão da frota de robôs e configuração de IA'
}

export default async function RoboPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get clinic_id
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    const isSuperUser = !userProfile || userProfile.tipo_perfil === 'admin' || userProfile.tipo_perfil === 'super_admin';

    if (!userProfile?.id_clinica && !isSuperUser) {
        // Fallback for non-admins without clinic
        return <div className="p-8">Erro: Usuário sem clínica vinculada.</div>
    }

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
                    Gestão de Robôs {userProfile?.tipo_perfil === 'super_admin' && '(Super Admin)'}
                </h1>
                <p className="text-gray-500">
                    Configure a personalidade da IA, monitore sessões e envie comandos para seus robôs Tirilo.
                </p>
            </header>

            <main className="flex-1 min-h-0">
                <RobotDashboard clinicaId={userProfile?.id_clinica || ''} />
            </main>
        </div>
    )
}
