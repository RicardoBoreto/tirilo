'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PromptFilter({ terapeutas }: { terapeutas: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentFilter = searchParams.get('terapeuta') || 'all'

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete('terapeuta')
        } else {
            params.set('terapeuta', value)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="w-[250px]">
            <Select value={currentFilter} onValueChange={handleChange}>
                <SelectTrigger className="bg-white border-gray-200 shadow-sm rounded-xl">
                    <SelectValue placeholder="Filtrar por Terapeuta" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Terapeutas</SelectItem>
                    {terapeutas.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome_completo || t.nome}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
