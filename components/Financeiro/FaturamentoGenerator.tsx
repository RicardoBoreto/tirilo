'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { gerarFaturamentoSessoes } from '@/lib/actions/financeiro'
import { getTerapeutas } from '@/lib/actions/equipe'
import { getClinica } from '@/lib/actions/clinica'
import InsuranceGuideModal from './InsuranceGuideModal'
import { Filter, CheckSquare, Square, Wand2, Printer } from 'lucide-react'

export default function FaturamentoGenerator() {
    const supabase = createClient()
    const [pendentes, setPendentes] = useState<any[]>([])
    const [selected, setSelected] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [showGuideModal, setShowGuideModal] = useState(false)
    const [clinica, setClinica] = useState<any>(null)

    // Therapist Filter
    const [terapeutas, setTerapeutas] = useState<any[]>([])
    const [selectedTerapeuta, setSelectedTerapeuta] = useState('todos')

    useEffect(() => {
        getTerapeutas().then(setTerapeutas)
        getClinica().then(setClinica)
    }, [])

    useEffect(() => {
        loadPendentes()
    }, [selectedTerapeuta]) // Reload when filter changes

    async function loadPendentes() {
        setLoading(true)
        // Fetch concluded appointments with NO financeiro_lancamento_id
        let query = supabase
            .from('agendamentos')
            .select(`
                id, data_hora_inicio, 
                paciente:pacientes(nome, convenio_nome, convenio_numero_carteirinha),
                terapeuta:usuarios(nome_completo)
            `)
            .eq('status', 'concluido')
            .is('id_lancamento_financeiro', null) // Not billed yet
            .order('data_hora_inicio', { ascending: false })

        if (selectedTerapeuta !== 'todos') {
            query = query.eq('id_terapeuta', selectedTerapeuta)
        }

        const { data, error } = await query

        if (!error && data) {
            setPendentes(data)
        }
        setLoading(false)
    }

    function toggleSelect(id: number) {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id))
        } else {
            setSelected([...selected, id])
        }
    }

    async function handleGerar() {
        if (selected.length === 0) return
        if (!confirm(`Gerar cobrança para ${selected.length} atendimentos?`)) return

        setProcessing(true)
        try {
            // We pass null for contractId for now, logic will auto-detect active contract
            await gerarFaturamentoSessoes(selected, null, new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
            alert('Faturamento gerado com sucesso!')
            setSelected([])
            loadPendentes()
        } catch (err: any) {
            alert('Erro: ' + err.message)
        } finally {
            setProcessing(false)
        }
    }

    // Filter selected items for the modal
    const selectedAppointments = pendentes.filter(p => selected.includes(p.id))

    if (loading) return <div className="p-8 text-center text-gray-500">Buscando atendimentos pendentes...</div>

    return (
        <div className="space-y-4 pt-6">
            <InsuranceGuideModal
                isOpen={showGuideModal}
                onClose={() => setShowGuideModal(false)}
                appointments={selectedAppointments}
                clinica={clinica}
            />

            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-700 dark:text-white">
                    Faturamento Pendente
                </h3>
                <div className="flex gap-3">
                    <select
                        value={selectedTerapeuta}
                        onChange={(e) => setSelectedTerapeuta(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 min-w-[200px]"
                    >
                        <option value="todos">Todos os Terapeutas</option>
                        {terapeutas.map(t => (
                            <option key={t.id} value={t.id}>{t.nome_completo}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowGuideModal(true)}
                        disabled={selected.length === 0}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={18} />
                        Gerar Guia
                    </button>
                    <button
                        onClick={handleGerar}
                        disabled={selected.length === 0 || processing}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Wand2 size={18} />
                        {processing ? 'Gerando...' : `Gerar Fatura (${selected.length})`}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="w-12 px-6 py-4">
                                <span className="sr-only">Select</span>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Terapeuta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pendentes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    Todos os atendimentos concluídos já foram faturados.
                                </td>
                            </tr>
                        ) : (
                            pendentes.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer ${selected.includes(item.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                    onClick={() => toggleSelect(item.id)}
                                >
                                    <td className="px-6 py-4">
                                        {selected.includes(item.id) ?
                                            <CheckSquare className="text-indigo-600" size={20} /> :
                                            <Square className="text-gray-300" size={20} />
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(item.data_hora_inicio).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {item.paciente?.nome}
                                        {item.paciente?.convenio_nome && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                {item.paciente.convenio_nome}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.terapeuta?.nome_completo}
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
