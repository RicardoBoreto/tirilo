'use client'

import { useState } from 'react'
import { createPaciente } from '@/lib/actions/pacientes'
import { useRouter } from 'next/navigation'

export default function NovoPacienteForm({ clinicaId }: { clinicaId: number }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.append('clinica_id', clinicaId.toString())

        try {
            const newPaciente = await createPaciente(formData)
            router.push(`/clinica/${clinicaId}/pacientes/${newPaciente.id}`)
        } catch (error) {
            console.error(error)
            alert('Erro ao criar paciente')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                    </label>
                    <input
                        name="nome"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Nome do paciente"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Nascimento *
                    </label>
                    <input
                        name="data_nascimento"
                        type="date"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Configurações Financeiras (Padrão)
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Valor da Sessão (R$)
                            </label>
                            <input
                                name="valor_sessao_padrao"
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Dia de Vencimento
                            </label>
                            <input
                                name="dia_vencimento_padrao"
                                type="number"
                                min="1"
                                max="31"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ex: 10"
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Convênio / Plano de Saúde (Opcional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Nome do Convênio (ex: Unimed)
                            </label>
                            <input
                                name="convenio_nome"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Nome do plano"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Nº da Carteirinha
                            </label>
                            <input
                                name="convenio_numero_carteirinha"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Número identificador"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Validade
                            </label>
                            <input
                                name="convenio_validade"
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações Iniciais
                    </label>
                    <textarea
                        name="observacoes"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Alguma observação importante..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50"
                >
                    {loading ? 'Criando...' : 'Criar e Continuar'}
                </button>
            </div>
        </form>
    )
}
