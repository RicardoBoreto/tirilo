'use client'

import { useState } from 'react'
import { Paciente } from '@/lib/actions/pacientes'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X, Users as UsersIcon } from 'lucide-react'
import { CuteUsers } from '@/components/icons/CuteIcons'
import PacienteRow from '@/components/Pacientes/PacienteRow'

interface PatientsListProps {
    initialPacientes: Paciente[]
}

export default function PatientsList({ initialPacientes }: PatientsListProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPacientes = initialPacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchQuery.toLowerCase())
    )

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

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    type="text"
                    placeholder="Buscar pacientes pelo nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-gray-200 bg-white dark:bg-gray-800 shadow-sm focus:ring-primary focus:border-primary text-lg transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {filteredPacientes.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex flex-col items-center gap-4">
                        <UsersIcon className="w-16 h-16 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            {searchQuery 
                                ? `Não encontramos nenhum paciente correspondente a "${searchQuery}". Tente outro termo.` 
                                : 'Comece adicionando o primeiro paciente da clínica para iniciar os atendimentos.'}
                        </p>
                        {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-2 text-primary border-primary/20 hover:bg-primary/5">
                                Limpar Busca
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                                {filteredPacientes.map((paciente) => (
                                    <PacienteRow
                                        key={paciente.id}
                                        paciente={paciente}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {filteredPacientes.map((paciente) => {
                            const idade = calcularIdade(paciente.data_nascimento)
                            return (
                                <Link key={paciente.id} href={`/admin/pacientes/${paciente.id}`}>
                                    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all active:scale-95 bg-white dark:bg-gray-800 group">
                                        <CardContent className="p-6 flex flex-col items-center gap-4">
                                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white ring-2 ring-primary/10 transition-transform group-hover:scale-110">
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
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                                    {paciente.nome}
                                                </h3>
                                                <div className="flex justify-center gap-2 mb-2">
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
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
            )}
        </div>
    )
}
