'use client'

import { useState } from 'react'
import { updateTerapeuta } from '@/lib/actions/terapeutas'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface EditTerapeutaFormProps {
    terapeuta: any
    curriculo: any
}

export default function EditTerapeutaForm({ terapeuta, curriculo }: EditTerapeutaFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fotoPreview, setFotoPreview] = useState<string | null>(terapeuta.foto_url)

    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.append('id', terapeuta.id)

        try {
            await updateTerapeuta(formData)
            // router.push(`/admin/terapeutas/${terapeuta.id}`) // Don't redirect away
            router.refresh()
            // Optional: Show success toast/message
            alert('Perfil atualizado com sucesso!')
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar terapeuta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foto do Terapeuta
                    </label>
                    <div className="flex items-center gap-4">
                        {fotoPreview ? (
                            <Image
                                src={fotoPreview}
                                alt="Preview"
                                width={80}
                                height={80}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-2xl">
                                {terapeuta.nome_completo.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <input
                            type="file"
                            name="foto"
                            accept="image/*"
                            onChange={handleFotoChange}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-blue-900/20 dark:file:text-blue-400"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        defaultValue={terapeuta.nome_completo}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-mail *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={terapeuta.email}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CPF
                    </label>
                    <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        defaultValue={terapeuta.cpf || ''}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="celular" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Celular WhatsApp
                    </label>
                    <input
                        type="text"
                        id="celular"
                        name="celular"
                        defaultValue={terapeuta.celular_whatsapp || ''}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="registro_profissional" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Registro Profissional
                    </label>
                    <input
                        type="text"
                        id="registro_profissional"
                        name="registro_profissional"
                        defaultValue={curriculo?.registro_profissional || ''}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="formacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Formação
                    </label>
                    <input
                        type="text"
                        id="formacao"
                        name="formacao"
                        defaultValue={curriculo?.formacao || ''}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="especialidades" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Especialidades (separadas por vírgula)
                    </label>
                    <input
                        type="text"
                        id="especialidades"
                        name="especialidades"
                        defaultValue={curriculo?.especialidades?.join(', ') || ''}
                        placeholder="Ex: Musicoterapia, Psicoterapia"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="publico_alvo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Público Alvo (separados por vírgula)
                    </label>
                    <input
                        type="text"
                        id="publico_alvo"
                        name="publico_alvo"
                        defaultValue={curriculo?.publico_alvo?.join(', ') || ''}
                        placeholder="Ex: Crianças, Adolescentes"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Biografia
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        defaultValue={curriculo?.bio || ''}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personalização da IA</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Preencha estes campos para que a IA possa gerar planos de intervenção alinhados ao seu estilo.
                    </p>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="tecnicas_preferidas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Técnicas e Abordagens Preferidas
                    </label>
                    <textarea
                        id="tecnicas_preferidas"
                        name="tecnicas_preferidas"
                        rows={3}
                        defaultValue={curriculo?.tecnicas_preferidas || ''}
                        placeholder="Ex: ABA, Denver, Integração Sensorial..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="recursos_preferidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recursos e Instrumentos Preferidos
                    </label>
                    <textarea
                        id="recursos_preferidos"
                        name="recursos_preferidos"
                        rows={3}
                        defaultValue={curriculo?.recursos_preferidos || ''}
                        placeholder="Ex: Violão, Piano, Tambor do Oceano, Fantoches..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="estilo_conducao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estilo Afetivo e Condução
                    </label>
                    <textarea
                        id="estilo_conducao"
                        name="estilo_conducao"
                        rows={3}
                        defaultValue={curriculo?.estilo_conducao || ''}
                        placeholder="Ex: Diretiva, lúdica, acolhedora, firme quando necessário..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="observacoes_clinicas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações Importantes da Prática
                    </label>
                    <textarea
                        id="observacoes_clinicas"
                        name="observacoes_clinicas"
                        rows={3}
                        defaultValue={curriculo?.observacoes_clinicas || ''}
                        placeholder="Ex: Sempre inicio com música de boas-vindas, priorizo a regulação sensorial..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configurações Financeiras</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Valor Hora Padrão (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="valor_hora_padrao"
                                defaultValue={curriculo?.valor_hora_padrao || ''}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Porcentagem de Repasse (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="porcentagem_repasse"
                                defaultValue={curriculo?.porcentagem_repasse || ''}
                                placeholder="Ex: 50"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    )
}
