import { getPacientes } from '@/lib/actions/pacientes'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CuteUsers } from '@/components/icons/CuteIcons'
import { Plus } from 'lucide-react'
import PacienteRow from '@/components/Pacientes/PacienteRow'

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

            {
                pacientes.length === 0 ? (
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pacientes.map((paciente) => (
                                        <PacienteRow
                                            key={paciente.id}
                                            paciente={paciente}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {pacientes.map((paciente) => {
                                const idade = calcularIdade(paciente.data_nascimento)
                                return (
                                    <Link key={paciente.id} href={`/admin/pacientes/${paciente.id}`}>
                                        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
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
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )
            }
        </div >
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
