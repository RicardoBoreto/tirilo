import { getTerapeutas, getClinicaLimit } from '@/lib/actions/terapeutas'
import TerapeutaList from '@/components/TerapeutaList'

export default async function TerapeutasPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const clinicaId = parseInt(id)

    const [terapeutas, limit] = await Promise.all([
        getTerapeutas(clinicaId),
        getClinicaLimit(clinicaId)
    ])

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Equipe Terapêutica</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Gerencie os terapeutas da sua clínica e controle as licenças de acesso.
                </p>
            </div>

            <TerapeutaList
                terapeutas={terapeutas}
                limit={limit}
                clinicaId={clinicaId}
            />
        </div>
    )
}
