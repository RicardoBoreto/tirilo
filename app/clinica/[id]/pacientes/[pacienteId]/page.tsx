import {
    getPaciente,
    getResponsaveis,
    getAnamnese,
    getPacientesTerapeutas
} from '@/lib/actions/pacientes'
import { getTerapeutas } from '@/lib/actions/terapeutas'
import { getRelatoriosByPaciente } from '@/lib/actions/relatorios'
import PacienteDetailsTabs from '@/components/PacienteDetailsTabs'
import Link from 'next/link'

export default async function PacienteDetailsPage({
    params
}: {
    params: Promise<{ id: string, pacienteId: string }>
}) {
    const { id, pacienteId } = await params
    const clinicaId = parseInt(id)
    const pId = parseInt(pacienteId)

    const [
        paciente,
        responsaveis,
        anamnese,
        terapeutasData,
        linkedTerapeutaIds,
        relatorios
    ] = await Promise.all([
        getPaciente(pId),
        getResponsaveis(pId),
        getAnamnese(pId),
        getTerapeutas(), // No args needed as it uses session user's clinic
        getPacientesTerapeutas(pId),
        getRelatoriosByPaciente(pId)
    ])

    if (!paciente) {
        return <div>Paciente não encontrado</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/clinica/${clinicaId}/pacientes`}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {paciente.nome}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Prontuário Digital
                    </p>
                </div>
            </div>

            <PacienteDetailsTabs
                paciente={paciente}
                responsaveis={responsaveis || []}
                anamnese={anamnese}
                allTerapeutas={terapeutasData.terapeutas}
                linkedTerapeutaIds={linkedTerapeutaIds}
                relatorios={relatorios || []}
            />
        </div>
    )
}
