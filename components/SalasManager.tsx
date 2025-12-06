'use client'

import { useState } from 'react'
import { Sala } from '@/lib/actions/salas'
import { Button } from '@/components/ui/button'
import { Plus, Box } from 'lucide-react'
import SalaForm from '@/components/Salas/SalaForm'
import SalaCard from '@/components/Salas/SalaCard'

export default function SalasManager({ initialSalas }: { initialSalas: Sala[] }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Box className="w-6 h-6 text-primary" />
                        Salas de Atendimento
                    </h2>
                    <p className="text-gray-500">Gerencie os espaços físicos da clínica</p>
                </div>

                <SalaForm
                    trigger={
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Sala
                        </Button>
                    }
                    open={open}
                    onOpenChange={setOpen}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {initialSalas.map(sala => (
                    <SalaCard key={sala.id} sala={sala} />
                ))}

                {initialSalas.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma sala cadastrada</h3>
                        <p className="text-gray-500">Comece adicionando as salas de atendimento da sua clínica.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
