'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'

export default function PromptFilter({ terapeutas, isAdmin = false }: { terapeutas: any[], isAdmin?: boolean }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentTerapeutaFilter = searchParams.get('terapeuta') || 'all'
    const currentCategoriaFilter = searchParams.get('categoria') || 'all'

    function handleTerapeutaChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete('terapeuta')
        } else {
            params.set('terapeuta', value)
        }
        router.push(`?${params.toString()}`)
    }

    function handleCategoriaChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete('categoria')
        } else {
            params.set('categoria', value)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />

            {/* Filtro de Categoria */}
            <Select value={currentCategoriaFilter} onValueChange={handleCategoriaChange}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm rounded-xl">
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="plano">📋 Planos</SelectItem>
                    <SelectItem value="relatorio">📝 Relatórios</SelectItem>
                </SelectContent>
            </Select>

            {/* Filtro de Terapeuta - Apenas para Admins */}
            {isAdmin && (
                <Select value={currentTerapeutaFilter} onValueChange={handleTerapeutaChange}>
                    <SelectTrigger className="w-[220px] bg-white border-gray-200 shadow-sm rounded-xl">
                        <SelectValue placeholder="Terapeuta" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Terapeutas</SelectItem>
                        {terapeutas.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>{t.nome_completo || t.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    )
}
