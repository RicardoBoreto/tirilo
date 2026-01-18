'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { baixarLancamentoComComprovante } from '@/lib/actions/financeiro'
import { X, Upload, Check, AlertCircle } from 'lucide-react'

export default function BaixaModal({ isOpen, onClose, lancamento }: any) {
    // Default to today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [method, setMethod] = useState('pix')
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    if (!isOpen || !lancamento) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const formData = new FormData()
            formData.append('id', lancamento.id)
            formData.append('data_pagamento', date)
            formData.append('forma_pagamento', method)
            if (file) formData.append('comprovante', file)

            await baixarLancamentoComComprovante(formData)
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erro ao registrar baixa. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Pagamento</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Conta a Quitar:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{lancamento.descricao}</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lancamento.valor)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Pagamento</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="pix">PIX</option>
                            <option value="dinheiro">Dinheiro / Espécie</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="boleto">Boleto Bancário</option>
                            <option value="transferencia">Transferência</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprovante (Opcional)</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept="image/*,.pdf"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Upload size={24} />
                                <span className="text-sm">
                                    {file ? file.name : 'Clique para anexar arquivo'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'Salvando...' : (
                                <><Check size={18} /> Confirmar Baixa</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
