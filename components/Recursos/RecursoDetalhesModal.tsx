'use client'

import { Recurso } from '@/lib/actions/recursos'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { MapPin, Package, Image as ImageIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RecursoDetalhesModalProps {
    recurso: Recurso
    open: boolean
    onOpenChange: (open: boolean) => void
}

const STATUS_COLORS = {
    'Excelente': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Bom': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Necessita reparo': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Fora de uso': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function RecursoDetalhesModal({ recurso, open, onOpenChange }: RecursoDetalhesModalProps) {
    if (!recurso) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden rounded-3xl flex flex-col">
                <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-800 shrink-0">
                    {recurso.foto_url ? (
                        <Image
                            src={recurso.foto_url}
                            alt={recurso.nome_item}
                            fill
                            className="object-contain p-4"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-16 h-16" />
                        </div>
                    )}
                    <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${STATUS_COLORS[recurso.status_conservacao]}`}>
                            {recurso.status_conservacao}
                        </span>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            {recurso.nome_item}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span>Quantidade: <strong className="text-gray-700 dark:text-gray-200">{recurso.quantidade}</strong></span>
                        </div>
                        {recurso.localizacao && (
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>Local: <strong className="text-gray-700 dark:text-gray-200">{recurso.localizacao}</strong></span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {recurso.descricao && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                                    Descrição
                                </h3>
                                <div className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl">
                                    {recurso.descricao}
                                </div>
                            </div>
                        )}

                        {recurso.objetivos_terapeuticos && recurso.objetivos_terapeuticos.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                                    Objetivos Terapêuticos
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {recurso.objetivos_terapeuticos.map((obj, i) => (
                                        <div
                                            key={i}
                                            className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-100 dark:border-purple-800/50"
                                        >
                                            {obj}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
