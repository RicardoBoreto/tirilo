import NovoPacienteForm from '@/components/NovoPacienteForm'

export default async function NovoPacientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const clinicaId = parseInt(id)

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Novo Paciente</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Preencha os dados básicos para iniciar o cadastro.
                </p>
            </div>

            <NovoPacienteForm clinicaId={clinicaId} />
        </div>
    )
}
