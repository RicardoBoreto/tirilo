'use client'

import { useState } from 'react'
import { togglePacienteTerapeuta } from '@/lib/actions/pacientes_fix'
import { Terapeuta } from '@/lib/actions/terapeutas'
import { useRouter } from 'next/navigation'

type Props = {
    pacienteId: number
    allTerapeutas: Terapeuta[]
    linkedTerapeutaIds: string[]
}

export default function TerapeutasTab({ pacienteId, allTerapeutas, linkedTerapeutaIds }: Props) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    async function handleToggle(terapeutaId: string, isLinked: boolean) {
        setLoadingId(terapeutaId)
        try {
            await togglePacienteTerapeuta(pacienteId, terapeutaId, !isLinked)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar vínculo')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Terapeutas Vinculados
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione os terapeutas que atendem este paciente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTerapeutas.map((terapeuta) => {
                    const isLinked = linkedTerapeutaIds.includes(terapeuta.id)
                    const isLoading = loadingId === terapeuta.id

                    return (
                        <div
                            key={terapeuta.id}
                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${isLinked
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            onClick={() => !isLoading && handleToggle(terapeuta.id, isLinked)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                                    {terapeuta.foto_url ? (
                                        <img src={terapeuta.foto_url} alt={terapeuta.nome_completo} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        terapeuta.nome_completo.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                        {terapeuta.nome_completo}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {terapeuta.terapeutas_curriculo?.[0]?.especialidades?.join(', ') || 'Terapeuta'}
                                    </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isLinked
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {isLoading ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : isLinked && (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
