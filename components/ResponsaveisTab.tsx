'use client'

import { useState } from 'react'
import { addResponsavel, removeResponsavel } from '@/lib/actions/pacientes'
import { updateResponsavel } from '@/lib/actions/pacientes_fix'
import { enableResponsavelAccess } from '@/lib/actions/familia'
import { useRouter } from 'next/navigation'

type Props = {
    pacienteId: number
    responsaveis: any[]
}

export default function ResponsaveisTab({ pacienteId, responsaveis }: Props) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        whatsapp: '',
        email: '',
        grau_parentesco: '',
        responsavel_principal: false,
    })

    function handleEdit(rel: any) {
        setEditingId(rel.responsavel_id)
        setFormData({
            nome: rel.responsavel.nome,
            cpf: rel.responsavel.cpf,
            whatsapp: rel.responsavel.whatsapp,
            email: rel.responsavel.email || '',
            grau_parentesco: rel.grau_parentesco,
            responsavel_principal: rel.responsavel_principal,
        })
        setShowForm(true)
    }

    function handleCancel() {
        setShowForm(false)
        setEditingId(null)
        setFormData({
            nome: '',
            cpf: '',
            whatsapp: '',
            email: '',
            grau_parentesco: '',
            responsavel_principal: false,
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingId) {
                await updateResponsavel(pacienteId, editingId, formData)
            } else {
                await addResponsavel(pacienteId, formData)
            }
            handleCancel()
            router.refresh()
        } catch (error) {
            console.error('Erro ao salvar responsável:', error)
            alert('Erro ao salvar responsável')
        } finally {
            setLoading(false)
        }
    }

    async function handleRemove(responsavelId: number) {
        if (!confirm('Deseja realmente remover este responsável?')) return

        try {
            await removeResponsavel(pacienteId, responsavelId)
            router.refresh()
        } catch (error) {
            console.error('Erro ao remover responsável:', error)
            alert('Erro ao remover responsável')
        }
    }

    async function handleEnableAccess(responsavelId: number, email: string, nome: string) {
        if (!confirm(`Deseja habilitar o acesso para ${nome}? Uma conta será criada com o e-mail ${email}.`)) return

        try {
            const result = await enableResponsavelAccess(responsavelId, email, nome)
            alert(result.message)
            router.refresh()
        } catch (error: any) {
            console.error('Erro ao habilitar acesso:', error)
            alert(error.message || 'Erro ao habilitar acesso')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Responsáveis
                </h2>
                <button
                    onClick={() => {
                        if (showForm) handleCancel()
                        else setShowForm(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    {showForm ? 'Cancelar' : '+ Adicionar Responsável'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {editingId ? 'Editar Responsável' : 'Novo Responsável'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                CPF *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                WhatsApp *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                E-mail *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Grau de Parentesco *
                            </label>
                            <select
                                required
                                value={formData.grau_parentesco}
                                onChange={(e) => setFormData({ ...formData, grau_parentesco: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Mãe">Mãe</option>
                                <option value="Pai">Pai</option>
                                <option value="Avó">Avó</option>
                                <option value="Avô">Avô</option>
                                <option value="Tia">Tia</option>
                                <option value="Tio">Tio</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="responsavel_principal"
                                checked={formData.responsavel_principal}
                                onChange={(e) => setFormData({ ...formData, responsavel_principal: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="responsavel_principal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Responsável Principal
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Responsável'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {responsaveis.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum responsável cadastrado
                </div>
            ) : (
                <div className="space-y-4">
                    {responsaveis.map((rel) => (
                        <div
                            key={rel.id}
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-start"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {rel.responsavel.nome}
                                    </h3>
                                    {rel.responsavel_principal && (
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded">
                                            Principal
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <div>
                                        <span className="font-medium">Parentesco:</span> {rel.grau_parentesco}
                                    </div>
                                    <div>
                                        <span className="font-medium">CPF:</span> {rel.responsavel.cpf}
                                    </div>
                                    <div>
                                        <span className="font-medium">WhatsApp:</span> {rel.responsavel.whatsapp}
                                    </div>
                                    {rel.responsavel.email && (
                                        <div>
                                            <span className="font-medium">E-mail:</span> {rel.responsavel.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleEdit(rel)}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleRemove(rel.responsavel_id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                >
                                    Remover
                                </button>
                                {!rel.responsavel.user_id && rel.responsavel.email && (
                                    <button
                                        onClick={() => handleEnableAccess(rel.responsavel_id, rel.responsavel.email!, rel.responsavel.nome)}
                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                                    >
                                        Habilitar Acesso
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
