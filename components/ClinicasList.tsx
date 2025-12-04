'use client'

import { Database } from '@/types/database.types'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CuteBuilding } from '@/components/icons/CuteIcons'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row'] & {
    terapeutas_cadastrados: number
}

export default function ClinicasList({ initialClinicas }: { initialClinicas: Clinica[] }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredClinicas = initialClinicas.filter((clinica) => {
        const search = searchTerm.toLowerCase()
        return (
            clinica.razao_social.toLowerCase().includes(search) ||
            clinica.nome_fantasia?.toLowerCase().includes(search) ||
            clinica.cnpj?.toLowerCase().includes(search)
        )
    })

    const getStatusBadge = (status: string) => {
        const styles = {
            ativo: 'bg-green-100 text-green-800 border-green-200',
            inativo: 'bg-red-100 text-red-800 border-red-200',
            suspenso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
        return styles[status as keyof typeof styles] || styles.ativo
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Buscar clínica..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 border-none shadow-none bg-transparent focus-visible:ring-0 h-12"
                    />
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Logo</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clínica</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CNPJ</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terapeutas</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plano</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredClinicas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-16 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <CuteBuilding className="w-12 h-12 text-gray-300" />
                                            <p>{searchTerm ? 'Nenhuma clínica encontrada' : 'Nenhuma clínica cadastrada'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClinicas.map((clinica) => (
                                    <tr key={clinica.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-8 py-5 text-sm text-gray-500">#{clinica.id}</td>
                                        <td className="px-8 py-5">
                                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm group-hover:scale-110 transition-transform">
                                                {clinica.logo_url ? (
                                                    <Image
                                                        src={clinica.logo_url}
                                                        alt="Logo"
                                                        fill
                                                        className="object-contain p-1"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                                        <CuteBuilding className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{clinica.nome_fantasia || clinica.razao_social}</p>
                                                <p className="text-xs text-gray-500">{clinica.razao_social}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-mono text-gray-500">{clinica.cnpj || '-'}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-100 rounded-full h-2 w-24 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full"
                                                        style={{ width: `${Math.min((clinica.terapeutas_cadastrados / clinica.max_terapeutas) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {clinica.terapeutas_cadastrados}/{clinica.max_terapeutas}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                                {clinica.plano_atual}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(clinica.status_assinatura)}`}>
                                                {clinica.status_assinatura}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/clinicas/${clinica.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                                        Ver
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/clinicas/${clinica.id}/editar`}>
                                                    <Button size="sm" variant="outline" className="h-8 rounded-xl border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700">
                                                        Editar
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredClinicas.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <CuteBuilding className="w-12 h-12 text-gray-300" />
                            <p>{searchTerm ? 'Nenhuma clínica encontrada' : 'Nenhuma clínica cadastrada'}</p>
                        </div>
                    </Card>
                ) : (
                    filteredClinicas.map((clinica) => (
                        <Card key={clinica.id} className="overflow-hidden border-none shadow-md">
                            <CardContent className="p-6 flex flex-col items-center gap-4">
                                <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white">
                                    {clinica.logo_url ? (
                                        <Image
                                            src={clinica.logo_url}
                                            alt="Logo"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                            <CuteBuilding className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center w-full space-y-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {clinica.nome_fantasia || clinica.razao_social}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-mono">
                                            {clinica.cnpj}
                                        </p>
                                    </div>

                                    <div className="flex justify-center gap-2 flex-wrap">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                            {clinica.plano_atual}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(clinica.status_assinatura)}`}>
                                            {clinica.status_assinatura}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-3 w-full">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Terapeutas</span>
                                            <span className="font-bold text-gray-700">{clinica.terapeutas_cadastrados}/{clinica.max_terapeutas}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${Math.min((clinica.terapeutas_cadastrados / clinica.max_terapeutas) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                    <Link href={`/admin/clinicas/${clinica.id}`} className="w-full">
                                        <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                                            Ver Detalhes
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/clinicas/${clinica.id}/editar`} className="w-full">
                                        <Button variant="outline" className="w-full border-green-200 text-green-600 hover:bg-green-50">
                                            Editar
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {filteredClinicas.length > 0 && (
                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-3xl shadow-sm border border-gray-100 text-center md:text-left">
                    <p className="text-sm text-gray-500">
                        Mostrando <span className="font-bold text-gray-900">{filteredClinicas.length}</span> de{' '}
                        <span className="font-bold text-gray-900">{initialClinicas.length}</span> clínicas
                    </p>
                </div>
            )}
        </div>
    )
}
