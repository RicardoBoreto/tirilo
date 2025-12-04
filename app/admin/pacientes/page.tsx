import { getPacientes } from '@/lib/actions/pacientes'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CuteUsers } from '@/components/icons/CuteIcons'
import { Plus } from 'lucide-react'

export default async function PacientesPage() {
    const pacientes = await getPacientes()

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CuteUsers className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            Pacientes
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground ml-1">
                        Gerencie os pacientes da clínica
                    </p>
                </div>
                <Link href="/admin/pacientes/novo">
                    <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Paciente
                    </Button>
                </Link>
            </div>

            {pacientes.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <div className="flex flex-col items-center gap-4">
                        <CuteUsers className="w-20 h-20 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Nenhum paciente cadastrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Comece adicionando o primeiro paciente da clínica para iniciar os atendimentos.
                        </p>
                        <Link href="/admin/pacientes/novo">
                            <Button className="mt-4">
                                Cadastrar Primeiro Paciente
                            </Button>
                        </Link>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Paciente
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Data de Nascimento
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Idade
                                    </th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {pacientes.map((paciente) => {
                                    const idade = calcularIdade(paciente.data_nascimento)
                                    return (
                                        <tr
                                            key={paciente.id}
                                            className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group"
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
                                            <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/pacientes/${paciente.id}`}>
                                                        <Button size="sm" variant="outline" className="h-8 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                                            Ver Detalhes
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/pacientes/${paciente.id}/editar`}>
                                                        <Button size="sm" variant="outline" className="h-8 rounded-xl border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700">
                                                            Editar
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {pacientes.map((paciente) => {
                            const idade = calcularIdade(paciente.data_nascimento)
                            return (
                                <Card key={paciente.id} className="overflow-hidden border-none shadow-md">
                                    <CardContent className="p-6 flex flex-col items-center gap-4">
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                                            {paciente.foto_url ? (
                                                <img
                                                    className="w-full h-full object-cover"
                                                    src={paciente.foto_url}
                                                    alt={paciente.nome}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-4xl">
                                                        {paciente.nome.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center w-full">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                {paciente.nome}
                                            </h3>
                                            <div className="flex justify-center gap-2 mb-2">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                    {idade} {idade === 1 ? 'ano' : 'anos'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Nasc: {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                            <Link href={`/admin/pacientes/${paciente.id}`} className="w-full">
                                                <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                                                    Ver Detalhes
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/pacientes/${paciente.id}/editar`} className="w-full">
                                                <Button variant="outline" className="w-full border-green-200 text-green-600 hover:bg-green-50">
                                                    Editar
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

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
