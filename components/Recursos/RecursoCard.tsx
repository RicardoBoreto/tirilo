'use client'

import { Recurso, deleteRecurso } from '@/lib/actions/recursos'
import { Edit2, Trash2, MapPin, Package, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import RecursoForm from './RecursoForm'
import RecursoDetalhesModal from './RecursoDetalhesModal'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface RecursoCardProps {
    recurso: Recurso
}

const STATUS_COLORS = {
    'Excelente': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Bom': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Necessita reparo': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Fora de uso': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function RecursoCard({ recurso }: RecursoCardProps) {
    const [showEdit, setShowEdit] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja excluir este recurso?')) return
        try {
            await deleteRecurso(recurso.id)
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir recurso')
        }
    }

    return (
        <>

            <div
                onClick={() => setShowDetails(true)}
                className="cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex flex-col h-full"
            >
                <div className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {recurso.foto_url ? (
                        <Image
                            src={recurso.foto_url}
                            alt={recurso.nome_item}
                            fill
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                    )}

                    <div className="absolute top-2 right-2">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
                            STATUS_COLORS[recurso.status_conservacao]
                        )}>
                            {recurso.status_conservacao}
                        </span>
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {recurso.nome_item}
                    </h3>

                    {recurso.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2" title={recurso.descricao}>
                            {recurso.descricao}
                        </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>Qtd: {recurso.quantidade}</span>
                        </div>
                        {recurso.localizacao && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{recurso.localizacao}</span>
                            </div>
                        )}
                    </div>

                    {recurso.objetivos_terapeuticos && recurso.objetivos_terapeuticos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {recurso.objetivos_terapeuticos.slice(0, 3).map((obj, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium"
                                >
                                    {obj}
                                </span>
                            ))}
                            {recurso.objetivos_terapeuticos.length > 3 && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-400 text-xs font-medium">
                                    +{recurso.objetivos_terapeuticos.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowEdit(true) }}
                        className="flex-1 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete() }}
                        className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <RecursoForm
                recurso={recurso}
                open={showEdit}
                onOpenChange={setShowEdit}
            />

            <RecursoDetalhesModal
                recurso={recurso}
                open={showDetails}
                onOpenChange={setShowDetails}
            />

        </>
    )
}
