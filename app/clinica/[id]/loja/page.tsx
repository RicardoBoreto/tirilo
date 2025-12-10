
import { Suspense } from 'react'
import { getLojaJogos } from '@/lib/actions/ludoterapia'
import ShopClient from './ShopClient'
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag } from 'lucide-react'

export default async function LojaPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const clinicaId = parseInt(id)

    // TODO: Adicionar verificação de permissão (se usuário pertence à clinicId)
    // Atualmente o middleware e RLS já protegem os dados, mas uma verificação extra aqui seria boa prática.

    const jogos = await getLojaJogos(clinicaId)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-xl">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Loja de Aplicativos
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
