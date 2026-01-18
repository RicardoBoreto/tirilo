'use client'

import { useState, useEffect } from 'react'
import { getOperadoras, saveOperadora, deleteOperadora, Operadora } from '@/lib/actions/operadoras'
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OperadorasTab() {
    const [operadoras, setOperadoras] = useState<Operadora[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOp, setEditingOp] = useState<Operadora | null>(null)
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const data = await getOperadoras()
        setOperadoras(data)
        setLoading(false)
    }

    function handleNew() {
        setEditingOp(null)
        setIsModalOpen(true)
    }

    function handleEdit(op: Operadora) {
        setEditingOp(op)
        setIsModalOpen(true)
    }

    async function handleDelete(id: number) {
        if (!confirm('Tem certeza que deseja inativar este convênio?')) return
        await deleteOperadora(id)
        loadData()
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            const formData = new FormData(e.currentTarget)
            if (editingOp) {
                formData.append('id', editingOp.id.toString())
            }
            await saveOperadora(formData)
            setIsModalOpen(false)
            loadData()
            router.refresh()
        } catch (error) {
            alert('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando convênios...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Convênios</h3>
                    <p className="text-sm text-gray-500">Cadastre as operadoras de saúde aceitas.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                    <Plus size={18} />
                    Novo Convênio
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operadoras.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>Nenhum convênio cadastrado.</p>
                    </div>
                )}

                {operadoras.map(op => (
                    <div key={op.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <Building2 size={24} />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={() => handleEdit(op)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(op.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate" title={op.nome_fantasia}>
                            {op.nome_fantasia}
                        </h4>
                        <p className="text-sm text-gray-500 truncate mb-4">
                            {op.razao_social || op.nome_fantasia}
                        </p>

                        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 border-t pt-3 dark:border-gray-700">
                            <div className="flex justify-between">
                                <span>CNPJ:</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">{op.cnpj || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ANS:</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">{op.registro_ans || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Prazo Pagto:</span>
                                <span className="text-gray-700 dark:text-gray-300">{op.prazo_pagamento_dias} dias</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingOp ? 'Editar Convênio' : 'Novo Convênio'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Fantasia *</label>
                                <input
                                    name="nome_fantasia"
                                    defaultValue={editingOp?.nome_fantasia}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="Ex: Unimed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                                <input
                                    name="razao_social"
                                    defaultValue={editingOp?.razao_social || ''}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="Ex: Unimed Rio Cooperativa..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                    <input
                                        name="cnpj"
                                        defaultValue={editingOp?.cnpj || ''}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registro ANS</label>
                                    <input
                                        name="registro_ans"
                                        defaultValue={editingOp?.registro_ans || ''}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        placeholder="Ex: 123456"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Prazo de Recebimento Padrão (Dias)
                                </label>
                                <input
                                    name="prazo_pagamento_dias"
                                    type="number"
                                    defaultValue={editingOp?.prazo_pagamento_dias || 30}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
