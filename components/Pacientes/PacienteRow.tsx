'use client'

import { useRouter } from 'next/navigation'

export default function PacienteRow({ paciente }: { paciente: any }) {
    const router = useRouter()

    function calcularIdade(dataNascimento: string): number {
        const hoje = new Date()
        const nascimento = new Date(dataNascimento)
        let idade = hoje.getFullYear() - nascimento.getFullYear()
        const mes = hoje.getMonth() - nascimento.getMonth()

        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--
        }

        return idade
    }

    const idade = calcularIdade(paciente.data_nascimento)

    return (
        <tr
            onClick={() => router.push(`/admin/pacientes/${paciente.id}`)}
            className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
        >
            <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 relative">
                        {paciente.foto_url ? (
                            <img
                                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                                src={paciente.foto_url}
                                alt={paciente.nome}
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    {paciente.nome.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="text-base font-bold text-gray-900 dark:text-white">
                            {paciente.nome}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                </div>
            </td>
            <td className="px-8 py-5 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {idade} {idade === 1 ? 'ano' : 'anos'}
                </span>
            </td>
        </tr>
    )
}
