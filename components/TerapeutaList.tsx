'use client'

import { useState } from 'react'
import { Terapeuta, createTerapeuta } from '@/lib/actions/terapeutas'
import { useRouter } from 'next/navigation'

export default function TerapeutaList({
    terapeutas,
    limit,
    clinicaId
}: {
    terapeutas: Terapeuta[],
    limit: number,
    clinicaId: number
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const isLimitReached = terapeutas.length >= limit

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await createTerapeuta(formData)
            setIsDialogOpen(false)
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Controle de Licenças</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerencie o acesso dos terapeutas à plataforma
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className={`text-2xl font-bold ${isLimitReached ? 'text-red-600' : 'text-green-600'}`}>
                            {terapeutas.length}
                        </span>
                        <span className="text-gray-400 text-sm"> / {limit} terapeutas</span>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            disabled={isLimitReached}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${isLimitReached
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            + Novo Terapeuta
                        </button>
                        {isLimitReached && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Limite de terapeutas atingido (plano atual permite apenas {limit}). Entre em contato para upgrade.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terapeutas.map((terapeuta) => (
                    <div key={terapeuta.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                                {terapeuta.foto_url ? (
                                    <img src={terapeuta.foto_url} alt={terapeuta.nome} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    terapeuta.nome.charAt(0)
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {terapeuta.nome}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {terapeuta.terapeutas_curriculo?.[0]?.registro_profissional || 'Sem registro'}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {terapeuta.terapeutas_curriculo?.[0]?.especialidades?.slice(0, 3).map((esp: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                            {esp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Terapeuta</h2>
                            <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                                    <input name="nome" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Senha Provisória</label>
                                    <input name="password" type="password" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">CPF</label>
                                    <input name="cpf" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Celular</label>
                                    <input name="celular" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Registro Profissional</label>
                                    <input name="registro_profissional" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Formação</label>
                                    <input name="formacao" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Especialidades (separar por vírgula)</label>
                                    <input name="especialidades" placeholder="Ex: Autismo, TDAH, Musicoterapia" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Público Alvo (separar por vírgula)</label>
                                    <input name="publico_alvo" placeholder="Ex: Crianças, Adolescentes" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Bio</label>
                                    <textarea name="bio" rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'Salvando...' : 'Criar Terapeuta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
