
import { Suspense } from 'react'
import { getLojaJogos } from '@/lib/actions/ludoterapia'
import ShopClient from '@/app/clinica/[id]/loja/ShopClient' // Importando do local existente
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLojaPage() {
    const supabase = await createClient()

    // 1. Obter usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 2. Obter ID da Clínica do usuário
    const { data: usuarioPerfil } = await supabase
        .from('usuarios')
        .select('id_clinica, tipo_perfil')
        .eq('id', user.id)
        .single()

    const clinicaId = usuarioPerfil?.id_clinica

    if (!clinicaId) {
        // Se for Super Admin sem clínica, talvez não deva ver a loja "pessoal", ou vê demo.
        // Vamos mostrar mensagem se não tiver clínica.
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold">Acesso Restrito</h1>
                <p>Apenas usuários vinculados a uma clínica podem acessar a loja.</p>
            </div>
        )
    }

    const jogos = await getLojaJogos(clinicaId)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 rounded-xl">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Loja de Apps
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Expanda as capacidades do seu Robô Tirilo com novos jogos e atividades terapêuticas.
                    </p>
                </div>
            </div>

            <Suspense fallback={<ShopSkeleton />}>
                <ShopClient clinicaId={clinicaId} jogos={jogos} />
            </Suspense>
        </div>
    )
}

function ShopSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[350px] rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col p-6 space-y-4">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex-grow" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
        </div>
    )
}
