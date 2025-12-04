'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getPaciente, updatePaciente } from '@/lib/actions/pacientes'

export default function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        nome: '',
        data_nascimento: '',
        foto_url: '',
        observacoes: '',
    })

    useEffect(() => {
        async function loadPaciente() {
            try {
                const paciente = await getPaciente(parseInt(id))
                if (paciente) {
                    setFormData({
                        nome: paciente.nome,
                        data_nascimento: paciente.data_nascimento,
                        foto_url: paciente.foto_url || '',
                        observacoes: paciente.observacoes || '',
                    })
                }
            } catch (err) {
                console.error('Erro ao carregar paciente:', err)
                setError('Erro ao carregar dados do paciente')
            } finally {
                setLoading(false)
            }
        }
        loadPaciente()
    }, [id])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const formDataObj = new FormData(e.currentTarget)
            await updatePaciente(parseInt(id), formDataObj)
            router.push(`/admin/pacientes/${id}`)
        } catch (err) {
            setError('Erro ao atualizar paciente. Tente novamente.')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Editar Paciente
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Atualize as informações do paciente
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
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
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
                        value={formData.foto_url}
                        onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
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
