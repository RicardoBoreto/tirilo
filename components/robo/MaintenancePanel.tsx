'use client'

import { useState, useEffect } from 'react'
import {
    MaintenanceOS,
    getMaintenanceOrders,
    getRobotHistory,
    createMaintenanceOrder,
    updateMaintenanceOrder,
    closeMaintenanceAndReleaseRobot
} from '@/lib/actions/manutencao'
import { Robot } from '@/lib/actions/robo'
import { format } from 'date-fns'

export default function MaintenancePanel({ robot, onClose }: { robot?: Robot, onClose?: () => void }) {
    const [orders, setOrders] = useState<MaintenanceOS[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>('list')
    const [selectedOS, setSelectedOS] = useState<MaintenanceOS | null>(null)

    // Create Form State
    const [newType, setNewType] = useState('corretiva')
    const [newDefect, setNewDefect] = useState('')
    const [autoBlock, setAutoBlock] = useState(true)

    useEffect(() => {
        loadData()
    }, [robot])

    async function loadData() {
        setIsLoading(true)
        if (robot) {
            const data = await getRobotHistory(robot.id)
            setOrders(data)
        } else {
            const data = await getMaintenanceOrders('ativos')
            setOrders(data)
        }
        setIsLoading(false)
    }

    async function handleCreate() {
        if (!robot) return
        try {
            await createMaintenanceOrder({
                robo_id: robot.id,
                tipo_manutencao: newType,
                defeito_relatado: newDefect,
                update_robot_status: autoBlock
            })
            alert('Ordem de Serviço aberta!')
            setViewMode('list')
            loadData()
        } catch (e) {
            alert('Erro: ' + e)
        }
    }

    async function handleUpdateOS(id: string, updates: any) {
        try {
            await updateMaintenanceOrder(id, updates)
            if (selectedOS) setSelectedOS({ ...selectedOS, ...updates })
            loadData()
        } catch (e) {
            alert('Erro ao atualizar: ' + e)
        }
    }

    async function handleCloseOS(os: MaintenanceOS) {
        if (!confirm('Deseja concluir a manutenção e liberar o robô?')) return
        try {
            if (robot) {
                // Contexto de um robô específico
                await closeMaintenanceAndReleaseRobot(os.id, robot.id)
            } else {
                // Contexto geral
                await closeMaintenanceAndReleaseRobot(os.id, os.robo_id)
            }
            alert('Manutenção concluída!')
            setViewMode('list')
            loadData()
        } catch (e) {
            alert('Erro: ' + e)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {robot ? `Manutenção: ${robot.nome_identificacao}` : 'Central de Manutenção'}
                </h3>
                <div className="flex gap-2">
                    {robot && viewMode === 'list' && (
                        <button
                            onClick={() => setViewMode('create')}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                            + Abrir Chamado
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                    )}
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {viewMode === 'list' && (
                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Nenhuma ordem de serviço encontrada.</p>
                        ) : (
                            orders.map(os => (
                                <div
                                    key={os.id}
                                    onClick={() => { setSelectedOS(os); setViewMode('details'); }}
                                    className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${os.status_os === 'aberto' ? 'bg-red-100 text-red-700' :
                                                os.status_os === 'concluido' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {os.status_os.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {os.data_entrada ? new Date(os.data_entrada).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        {os.tipo_manutencao.toUpperCase()}
                                        {!robot && <span className="text-sm font-normal text-gray-500 ml-2">- {os.robo_nome}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{os.defeito_relatado || 'Sem descrição do defeito.'}</p>
                                    {os.custo_total > 0 && (
                                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-2">
                                            Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.custo_total)}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {viewMode === 'create' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo de Manutenção</label>
                            <select
                                value={newType}
                                onChange={e => setNewType(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="corretiva">Corretiva (Defeito)</option>
                                <option value="preventiva">Preventiva</option>
                                <option value="upgrade">Upgrade / Melhoria</option>
                                <option value="preparacao">Preparação (Antes de Envio)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Defeito ou Problema Relatado</label>
                            <textarea
                                value={newDefect}
                                onChange={e => setNewDefect(e.target.value)}
                                className="w-full p-2 border rounded h-24"
                                placeholder="Descreva o que está acontecendo..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="blockRobot"
                                checked={autoBlock}
                                onChange={e => setAutoBlock(e.target.checked)}
                            />
                            <label htmlFor="blockRobot" className="text-sm text-gray-700 dark:text-gray-300">
                                Bloquear robô automaticamente (Status: Manutenção)
                            </label>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button onClick={handleCreate} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium">Abrir O.S.</button>
                            <button onClick={() => setViewMode('list')} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium">Cancelar</button>
                        </div>
                    </div>
                )}

                {viewMode === 'details' && selectedOS && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border text-sm space-y-2">
                            <p><span className="font-semibold">ID:</span> {selectedOS.id.slice(0, 8)}</p>
                            <p><span className="font-semibold">Defeito:</span> {selectedOS.defeito_relatado}</p>
                            <p><span className="font-semibold">Entrada:</span> {new Date(selectedOS.data_entrada).toLocaleString()}</p>
                            {selectedOS.data_fechamento && (
                                <p><span className="font-semibold">Fechamento:</span> {new Date(selectedOS.data_fechamento).toLocaleString()}</p>
                            )}
                        </div>

                        {selectedOS.status_os !== 'concluido' && selectedOS.status_os !== 'cancelado' && (
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="p-2 border rounded text-xs"
                                    value={selectedOS.status_os}
                                    onChange={(e) => handleUpdateOS(selectedOS.id, { status_os: e.target.value })}
                                >
                                    <option value="aberto">Aberto</option>
                                    <option value="em_analise">Em Análise</option>
                                    <option value="aguardando_peca">Aguardando Peça</option>
                                    <option value="em_reparo">Em Reparo</option>
                                    <option value="testes">Testes</option>
                                </select>
                                <button
                                    onClick={() => handleCloseOS(selectedOS)}
                                    className="bg-green-600 text-white text-xs rounded px-2"
                                >
                                    Concluir & Liberar
                                </button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold block mb-1">Diagnóstico Técnico</label>
                                <textarea
                                    className="w-full text-sm p-2 border rounded"
                                    rows={3}
                                    defaultValue={selectedOS.diagnostico_tecnico || ''}
                                    onBlur={(e) => handleUpdateOS(selectedOS.id, { diagnostico_tecnico: e.target.value })}
                                    placeholder="Resultado da análise..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold block mb-1">Solução Aplicada / Peças</label>
                                <textarea
                                    className="w-full text-sm p-2 border rounded"
                                    rows={3}
                                    defaultValue={selectedOS.solucao_aplicada || ''}
                                    onBlur={(e) => handleUpdateOS(selectedOS.id, { solucao_aplicada: e.target.value })}
                                    placeholder="O que foi feito? Peças trocadas?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold block mb-1">Custo Total (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full text-sm p-2 border rounded"
                                        defaultValue={selectedOS.custo_total}
                                        onBlur={(e) => handleUpdateOS(selectedOS.id, { custo_total: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-center pt-5">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        defaultChecked={selectedOS.faturado_cliente}
                                        onChange={(e) => handleUpdateOS(selectedOS.id, { faturado_cliente: e.target.checked })}
                                    />
                                    <label className="text-xs">Faturar ao Cliente?</label>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setViewMode('list')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium mt-4">
                            Voltar para Lista
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
