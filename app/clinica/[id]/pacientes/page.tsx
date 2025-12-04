import Link from 'next/link'
import { getPacientes } from '@/lib/actions/pacientes'

export default async function PacientesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const clinicaId = parseInt(id)
    const pacientes = await getPacientes(clinicaId)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Gerencie os pacientes e seus prontuários
                    </p>
                </div>
                <Link
                    href={`/clinica/${clinicaId}/pacientes/novo`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    + Novo Paciente
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pacientes.map((paciente) => (
                    <Link
                        key={paciente.id}
                        href={`/clinica/${clinicaId}/pacientes/${paciente.id}`}
                        className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-2xl">
                                {paciente.foto_url ? (
                                    <img src={paciente.foto_url} alt={paciente.nome} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    paciente.nome.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {paciente.nome}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                                </p>
                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${paciente.ativo
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                    {paciente.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}

                {pacientes.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                            Nenhum paciente cadastrado nesta clínica.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
