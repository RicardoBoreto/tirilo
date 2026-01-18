'use client'

import { createTerapeuta } from '@/lib/actions/terapeutas'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TerapeutaForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            await createTerapeuta(formData)
            router.push('/admin/terapeutas')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao criar terapeuta. Verifique os dados e tente novamente.')
            setIsLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">

            {/* Dados Pessoais */}
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 border-b pb-2">
                    Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nome Completo *
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="nome"
                                id="nome"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email *
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            CPF
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="cpf"
                                id="cpf"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="celular" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Celular
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="celular"
                                id="celular"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="foto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Foto de Perfil
                        </label>
                        <div className="mt-1 flex items-center">
                            <input
                                type="file"
                                name="foto"
                                id="foto"
                                accept="image/*"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Currículo */}
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 border-b pb-2">
                    Currículo Profissional
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="registro_profissional" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Registro Profissional (CRP/CRM/Etc)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="registro_profissional"
                                id="registro_profissional"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="formacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Formação Acadêmica
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="formacao"
                                id="formacao"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="especialidades" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Especialidades (separadas por vírgula)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="especialidades"
                                id="especialidades"
                                placeholder="Ex: Autismo, TDAH, Psicologia Infantil"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="publico_alvo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Público Alvo (separado por vírgula)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="publico_alvo"
                                id="publico_alvo"
                                placeholder="Ex: Crianças, Adolescentes, Adultos"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Biografia Resumida
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* Financeiro */}
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 border-b pb-2 pt-6">
                    Dados Financeiros
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="valor_hora_padrao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Valor Hora Padrão (R$)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                step="0.01"
                                name="valor_hora_padrao"
                                id="valor_hora_padrao"
                                placeholder="0.00"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="porcentagem_repasse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Porcentagem de Repasse (%)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                step="0.1"
                                name="porcentagem_repasse"
                                id="porcentagem_repasse"
                                placeholder="Ex: 50"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="chave_pix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Chave PIX
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="chave_pix"
                                id="chave_pix"
                                placeholder="CPF, Email, Telefone ou Aleatória"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Link
                    href="/admin/terapeutas"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Salvando...' : 'Salvar Terapeuta'}
                </button>
            </div>
        </form >
    )
}
