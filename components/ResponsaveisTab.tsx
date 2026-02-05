'use client'

import { useState } from 'react'
import { addResponsavel, removeResponsavel, searchResponsaveis, linkResponsavel, getResponsaveisDoTerapeuta } from '@/lib/actions/pacientes'
import { updateResponsavel } from '@/lib/actions/pacientes_fix'
import { enableResponsavelAccess, updateResponsavelPassword, unlinkResponsavelAccess } from '@/lib/actions/familia'
import { useRouter } from 'next/navigation'

type Props = {
    pacienteId: number
    responsaveis: any[]
}

export default function ResponsaveisTab({ pacienteId, responsaveis }: Props) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [showLinkList, setShowLinkList] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Create/Edit Form Data
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        whatsapp: '',
        email: '',
        grau_parentesco: '',
        responsavel_principal: false,
    })

    // Search/Link Data
    const [therapistResponsaveis, setTherapistResponsaveis] = useState<any[]>([])
    const [filterQuery, setFilterQuery] = useState('')
    const [loadingList, setLoadingList] = useState(false)

    // Modal de Vínculo (Parentesco)
    const [selectedForLink, setSelectedForLink] = useState<any | null>(null)
    const [linkData, setLinkData] = useState({
        grau_parentesco: '',
        responsavel_principal: false,
    })

    const [passwordModal, setPasswordModal] = useState<{ open: boolean, id: number | null, nome: string }>({ open: false, id: null, nome: '' })
    const [newPassword, setNewPassword] = useState('')

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
        setShowLinkList(false)
    }

    function handleCancel() {
        setShowForm(false)
        setShowLinkList(false)
        setEditingId(null)
        setFormData({
            nome: '',
            cpf: '',
            whatsapp: '',
            email: '',
            grau_parentesco: '',
            responsavel_principal: false,
        })
        setFilterQuery('')
        setSelectedForLink(null)
        setLinkData({ grau_parentesco: '', responsavel_principal: false })
    }

    async function handleShowLinkList() {
        if (showLinkList) {
            setShowLinkList(false)
            return
        }

        setShowForm(false) // Fecha form de criação se aberto
        setShowLinkList(true)
        setLoadingList(true)
        try {
            const data = await getResponsaveisDoTerapeuta()
            setTherapistResponsaveis(data)
        } catch (error) {
            console.error(error)
            alert('Erro ao carregar lista de responsáveis')
        } finally {
            setLoadingList(false)
        }
    }

    async function handleLinkSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedForLink) return
        setLoading(true)

        try {
            await linkResponsavel(pacienteId, selectedForLink.id, linkData)
            setSelectedForLink(null) // Fecha modal de vínculo mas mantém lista
            router.refresh()
            alert('Responsável vinculado com sucesso!')
        } catch (error: any) {
            console.error('Erro ao vincular:', error)
            alert(error.message || 'Erro ao vincular responsável')
        } finally {
            setLoading(false)
        }
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
        } catch (error: any) {
            console.error('Erro ao salvar responsável:', error)
            alert(error.message || 'Erro ao salvar responsável')
        } finally {
            setLoading(false)
        }
    }

    async function handleRemove(responsavelId: number) {
        if (!confirm('Deseja realmente remover este responsável deste paciente?')) return

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

    async function handleChangePasswordSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!passwordModal.id) return
        if (newPassword.length < 6) return alert('Senha deve ter pelo menos 6 caracteres')

        try {
            await updateResponsavelPassword(passwordModal.id, newPassword)
            alert('Senha alterada com sucesso!')
            setPasswordModal({ open: false, id: null, nome: '' })
            setNewPassword('')
        } catch (err: any) {
            alert(err.message)
        }
    }

    async function handleUnlinkAccess(responsavelId: number) {
        if (!confirm('Isso irá remover o vínculo de login atual (útil se o usuário não existir mais). Você poderá criar um novo em seguida. Continuar?')) return
        try {
            await unlinkResponsavelAccess(responsavelId)
            router.refresh()
        } catch (err: any) {
            alert(err.message)
        }
    }

    // Filtragem local
    const filteredResponsaveis = therapistResponsaveis.filter(r =>
        r.nome.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.cpf.includes(filterQuery)
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Responsáveis
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleShowLinkList}
                        className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${showLinkList
                            ? 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                            }`}
                    >
                        {showLinkList ? 'Fechar Lista' : 'Associar Existente'}
                    </button>
                    <button
                        onClick={() => {
                            if (showForm) handleCancel()
                            else {
                                setShowForm(true)
                                setShowLinkList(false)
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        {showForm ? 'Cancelar' : '+ Adicionar Novo'}
                    </button>
                </div>
            </div>

            {/* PAINEL DE VÍNCULO EXISTENTE */}
            {showLinkList && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-blue-100 dark:border-blue-900/50 shadow-sm space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Vincular Responsável Existente
                    </h3>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Filtrar por nome ou CPF..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {loadingList ? (
                        <div className="text-center py-8 text-gray-500">Carregando sua lista de responsáveis...</div>
                    ) : (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600 max-h-60 overflow-y-auto">
                            {filteredResponsaveis.length === 0 ? (
                                <p className="p-4 text-center text-gray-500">Nenhum responsável encontrado.</p>
                            ) : (
                                filteredResponsaveis.map(resp => {
                                    // Verificar se JÁ ESTÁ vinculado a ESTE paciente
                                    const isLinked = responsaveis.some(r => r.responsavel_id === resp.id)

                                    return (
                                        <div key={resp.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center transition-colors">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{resp.nome}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">CPF: {resp.cpf} | Tel: {resp.whatsapp}</p>
                                            </div>

                                            {isLinked ? (
                                                <button
                                                    onClick={() => handleRemove(resp.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                                                >
                                                    Desassociar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedForLink(resp)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                >
                                                    Associar
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE CONFIRMAÇÃO DO VÍNCULO */}
            {selectedForLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Confirmar Vínculo
                        </h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-300">
                            Você está vinculando <strong>{selectedForLink.nome}</strong> a este paciente.
                        </p>
                        <form onSubmit={handleLinkSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Grau de Parentesco *
                                </label>
                                <select
                                    required
                                    value={linkData.grau_parentesco}
                                    onChange={(e) => setLinkData({ ...linkData, grau_parentesco: e.target.value })}
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
                                    id="link_responsavel_principal"
                                    checked={linkData.responsavel_principal}
                                    onChange={(e) => setLinkData({ ...linkData, responsavel_principal: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="link_responsavel_principal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Responsável Principal
                                </label>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedForLink(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {loading ? 'Vinculando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FORMULÁRIO DE CRIAÇÃO (NOVO) */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4 border border-gray-200 dark:border-gray-600">
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
                                {rel.responsavel.user_id && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setNewPassword('')
                                                setPasswordModal({ open: true, id: rel.responsavel_id, nome: rel.responsavel.nome })
                                            }}
                                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 text-sm font-medium"
                                        >
                                            Alterar Senha
                                        </button>
                                        <button
                                            onClick={() => handleUnlinkAccess(rel.responsavel_id)}
                                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs font-medium"
                                            title="Clique aqui se o login estiver com problemas (usuário não encontrado)"
                                        >
                                            Resetar Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {passwordModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Alterar Senha de {passwordModal.nome}
                        </h3>
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nova Senha
                                </label>
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Digite a nova senha para o responsável.
                                </p>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModal({ open: false, id: null, nome: '' })}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Salvar Senha
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
