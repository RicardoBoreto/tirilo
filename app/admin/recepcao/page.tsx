import { getStatusSalas } from '@/lib/actions/recepcao'
import StatusSalas from '@/components/Recepcao/StatusSalas'
import AgendaGeral from '@/components/Recepcao/AgendaGeral'


export default async function RecepcaoPage() {
    const statusSalas = await getStatusSalas()

    return (
        <div className="space-y-8 h-[calc(100vh-100px)] flex flex-col">
            {/* Seção de Salas (Topo) */}
            <div className="flex-none">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Situação das Salas</h2>
                    <span className="text-sm text-gray-500">Atualizado em tempo real</span>
                </div>
                <StatusSalas salas={statusSalas} />
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Seção de Agenda (Restante da altura) */}
            <div className="flex-1 min-h-0">
                <AgendaGeral />
            </div>
        </div>
    )
}
