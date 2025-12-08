import { useEffect, useState } from 'react'
import { getLancamentos, baixarLancamento, FinanceiroLancamento } from '@/lib/actions/financeiro'
import { getDetalhesFatura } from '@/lib/actions/financeiro_fatura'
import { getTerapeutas } from '@/lib/actions/equipe'
import { CheckCheck, Clock, Search, Filter, Printer } from 'lucide-react'
import FaturaModal from './FaturaModal'

export default function LancamentosTable({ tipo }: { tipo: 'receita' | 'despesa' }) {
    const [lancamentos, setLancamentos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('todos')

    // Therapist Filter
    const [terapeutas, setTerapeutas] = useState<any[]>([])
    const [selectedTerapeuta, setSelectedTerapeuta] = useState('todos')

    const [checkingProfile, setCheckingProfile] = useState(true)

    // States for Invoice Modal
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [invoiceData, setInvoiceData] = useState<any>(null)
    const [loadingInvoice, setLoadingInvoice] = useState(false)

    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        // Fetch User Profile first to check role
        import('@/lib/actions/equipe').then(({ getCurrentUserProfile }) => {
            getCurrentUserProfile().then(user => {
                if (user?.tipo_perfil === 'terapeuta') {
                    setSelectedTerapeuta(user.id)
                    setIsLocked(true)
                    setTerapeutas([user])
                } else {
                    getTerapeutas().then(setTerapeutas)
                }
            }).finally(() => {
                setCheckingProfile(false)
            })
        })
    }, [])

    useEffect(() => {
        if (!checkingProfile) loadData()
    }, [tipo, selectedTerapeuta, checkingProfile])

    async function loadData() {
        setLoading(true)
        try {
            const data = await getLancamentos({
                tipo,
                terapeutaId: selectedTerapeuta
            })
            setLancamentos(data)
        } finally {
            setLoading(false)
        }
    }

    async function handleBaixa(id: number) {
        if (!confirm('Confirmar recebimento/pagamento desta conta?')) return

        try {
            await baixarLancamento(id, new Date().toISOString(), 'pix')
            loadData()
        } catch (err) {
            alert('Erro ao baixar')
        }
    }

    async function handleViewInvoice(id: number) {
        setLoadingInvoice(true)
        try {
            const details = await getDetalhesFatura(id)
            if (details) {
                setInvoiceData(details)
                setShowInvoiceModal(true)
            } else {
                alert('Detalhes da fatura não encontrados.')
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao carregar fatura.')
        } finally {
            setLoadingInvoice(false)
        }
    }

    const filtered = lancamentos.filter(l => statusFilter === 'todos' ? true : l.status === statusFilter)

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando lançamentos...</div>

    return (
        <div className="space-y-4 pt-6">
            <FaturaModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                dados={invoiceData}
            />

            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-700 dark:text-white">
                    {tipo === 'receita' ? 'Contas a Receber' : 'Contas a Pagar'}
                </h3>
                <div className="flex gap-2">
                    <select
                        value={selectedTerapeuta}
                        onChange={(e) => setSelectedTerapeuta(e.target.value)}
                        disabled={isLocked}
                        className={`border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 max-w-[200px] ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {!isLocked && <option value="todos">Todos os Terapeutas</option>}
                        {terapeutas.map(t => (
                            <option key={t.id} value={t.id}>{t.nome_completo}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                        <option value="todos">Todos os Status</option>
                        <option value="pendente">Pendentes</option>
                        <option value="pago">Liquidados</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vencimento</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Descrição/Paciente</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Valor</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    Nenhum lançamento encontrado
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{item.descricao}</span>
                                            {item.paciente && (
                                                <span className="text-xs text-gray-500">Pct: {item.paciente.nome}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.categoria?.nome || '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleViewInvoice(item.id)}
                                            className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                                            title="Visualizar Fatura"
                                            disabled={loadingInvoice}
                                        >
                                            <Printer size={16} />
                                        </button>

                                        {item.status === 'pendente' && (
                                            <button
                                                onClick={() => handleBaixa(item.id)}
                                                className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                            >
                                                Quitar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'pago') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCheck size={12} /> Pago
            </span>
        )
    }
    if (status === 'pendente') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock size={12} /> Pendente
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
        </span>
    )
}
