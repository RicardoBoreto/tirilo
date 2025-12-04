'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPaciente } from '@/lib/actions/pacientes'

export default function NovoPacientePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const formData = new FormData(e.currentTarget)
            // TODO: Pegar clinica_id do contexto/sessão
            formData.append('clinica_id', '1')

            const paciente = await createPaciente(formData)
            router.push(`/admin/pacientes/${paciente.id}`)
        } catch (err) {
            setError('Erro ao criar paciente. Tente novamente.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Novo Paciente
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Cadastre um novo paciente na clínica
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Nome completo do paciente"
                    />
                </div>

                <div>
                    <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Nascimento *
                    </label>
                    <input
                        type="date"
                        id="data_nascimento"
                        name="data_nascimento"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="foto_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL da Foto (opcional)
                    </label>
                    <input
                        type="url"
                        id="foto_url"
                        name="foto_url"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="https://exemplo.com/foto.jpg"
                    />
                </div>

                <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                    </label>
                    <textarea
                        id="observacoes"
                        name="observacoes"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Observações gerais sobre o paciente"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : 'Salvar Paciente'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    )
}
