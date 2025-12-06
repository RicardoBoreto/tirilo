'use client'

import { Sala, deleteSala } from '@/lib/actions/salas'
import { Box, Music, Gamepad2, Puzzle, BookOpen, Smile, Star, Heart, Sun, Cloud, Moon, Flower, Zap, Anchor, Coffee, Edit2, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import SalaForm from './SalaForm'
import { cn } from '@/lib/utils'

const ICONS: Record<string, any> = {
    box: Box,
    music: Music,
    gamepad: Gamepad2,
    puzzle: Puzzle,
    book: BookOpen,
    smile: Smile,
    star: Star,
    heart: Heart,
    sun: Sun,
    cloud: Cloud,
    moon: Moon,
    flower: Flower,
    zap: Zap,
    anchor: Anchor,
    coffee: Coffee,
}

interface SalaCardProps {
    sala: Sala
}

export default function SalaCard({ sala }: SalaCardProps) {
    // Icon field doesn't exist in type, defaulting to Box or mapping from name/description if needed
    const Icon = Box
    const [showEdit, setShowEdit] = useState(false)

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja excluir esta sala?')) return
        try {
            await deleteSala(sala.id)
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir sala')
        }
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group relative overflow-hidden">
                {/* Color Stripe */}
                <div
                    className="absolute top-0 left-0 w-2 h-full"
                    style={{ backgroundColor: sala.cor_identificacao }}
                />

                {/* Photo Background */}
                {sala.foto_url && (
                    <div className="absolute inset-0 opacity-10">
                        <img
                            src={sala.foto_url}
                            alt={sala.nome}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="pl-4 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: sala.cor_identificacao }}
                        >
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                            sala.ativa
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                            {sala.ativa ? 'Disponível' : 'Inativo'}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {sala.nome}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Capacidade: {sala.capacidade}</span>
                    </div>

                    {sala.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-2 min-h-[40px]">
                            {sala.descricao}
                        </p>
                    )}

                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                        <button
                            onClick={() => setShowEdit(true)}
                            className="flex-1 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <SalaForm
                sala={sala}
                open={showEdit}
                onOpenChange={setShowEdit}
            />
        </>
    )
}
