'use client'

import { useState, useEffect } from 'react'
import {
    getRobots,
    getRobotConfig,
    updateRobotConfig,
    sendCommand,
    getTelemetry,
    registerRobot,
    toggleRobotBlock,
    updateRobot,
    type Robot,
    type RobotConfig,
    type Telemetry
} from '@/lib/actions/robo'
import { getAllClinics } from '@/lib/actions/clinicas'
import MaintenancePanel from './MaintenancePanel'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function RobotDashboard({ clinicaId }: { clinicaId?: string }) {
    const [robots, setRobots] = useState<Robot[]>([])
    const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null)
    const [config, setConfig] = useState<RobotConfig | null>(null)
    const [telemetry, setTelemetry] = useState<Telemetry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Config Form State
    const [prompt, setPrompt] = useState('')
    const [voice, setVoice] = useState('pt-br')

    // New Robot Form
    const [newMac, setNewMac] = useState('')
    const [newName, setNewName] = useState('')
    const [newClinicId, setNewClinicId] = useState('')

    // Clinics Data
    const [clinics, setClinics] = useState<{ id: number, nome_fantasia: string }[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        nome: '',
        mac: '',
        clinicaId: '',
        modelo: '',
        versao: '',
        serial: '',
        venda: '0',
        aluguel: '0',
        statusOp: 'disponivel',
        foto: ''
    })

    useEffect(() => {
        loadRobots()
        loadConfig()
        loadClinics()
    }, [clinicaId])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (selectedRobot) {
            loadTelemetry(selectedRobot.mac_address)
            interval = setInterval(() => {
                loadTelemetry(selectedRobot.mac_address, true)
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [selectedRobot])

    async function loadRobots() {
        setIsLoading(true)
        const data = await getRobots(clinicaId)
        setRobots(data)
        setIsLoading(false)
    }

    async function loadClinics() {
        const data = await getAllClinics()
        setClinics(data || [])
    }

    async function loadConfig() {
        if (!clinicaId) return
        const data = await getRobotConfig(clinicaId)
        if (data) {
            setConfig(data)
            setPrompt(data.prompt_personalidade_robo)
            setVoice(data.motor_voz_preferencial)
        }
    }

    async function loadTelemetry(mac: string, background = false) {
        if (!background) setIsLoading(true)
        const data = await getTelemetry(mac)
        setTelemetry(data)
        if (!background) setIsLoading(false)
    }

    async function handleSaveConfig() {
        if (!clinicaId) return alert('Configuração global não disponível para Super Admin (Selecione uma clínica primeiro - Feature Futura)')
        try {
            await updateRobotConfig(clinicaId, {
                prompt_personalidade_robo: prompt,
                motor_voz_preferencial: voice
            })
            alert('Configuração salva com sucesso!')
            loadConfig()
        } catch (e) {
            alert('Erro ao salvar config: ' + e)
        }
    }

    async function handleCommand(cmd: string, params: any = {}) {
        if (!selectedRobot) return
        try {
            await sendCommand(selectedRobot.mac_address, cmd, params)
            // Feedback visual could be better, just alert for MVP
        } catch (e) {
            alert('Erro ao enviar comando: ' + e)
        }
    }

    async function handleRegister() {
        if (!newMac || !newName) return alert("Preencha MAC e Nome")
        try {
            await registerRobot(newMac, newName, newClinicId || clinicaId) // Use selected or prop
            setNewMac('')
            setNewName('')
            setNewClinicId('')
            loadRobots()
        } catch (e) {
            alert('Erro ao registrar: ' + e)
        }
    }

    async function handleUpdateRobot() {
        if (!selectedRobot) return
        try {
            await updateRobot(selectedRobot.id, {
                nome_identificacao: editForm.nome,
                mac_address: editForm.mac,
                id_clinica: editForm.clinicaId || null,
                modelo_hardware: editForm.modelo,
                versao_hardware: editForm.versao,
                numero_serie: editForm.serial,
                valor_venda: parseFloat(editForm.venda) || 0,
                valor_aluguel: parseFloat(editForm.aluguel) || 0,
                status_operacional: editForm.statusOp,
                foto_url: editForm.foto
            })
            alert('Robô atualizado!')
            setIsEditing(false)
            loadRobots() // Refresh list

            // Optimistic update logic simplified: refresh list is safer. 
            // If we really want optimistic:
            // setSelectedRobot(prev => prev ? { ...prev, ...updatedFields } : null)
        } catch (e) {
            alert('Erro ao atualizar: ' + e)
        }
    }

    // Initialize edit form when robot is selected
    useEffect(() => {
        if (selectedRobot) {
            setEditForm({
                nome: selectedRobot.nome_identificacao,
                mac: selectedRobot.mac_address,
                clinicaId: selectedRobot.id_clinica ? String(selectedRobot.id_clinica) : '',
                modelo: selectedRobot.modelo_hardware || '',
                versao: selectedRobot.versao_hardware || '',
                serial: selectedRobot.numero_serie || '',
                venda: selectedRobot.valor_venda ? String(selectedRobot.valor_venda) : '0',
                aluguel: selectedRobot.valor_aluguel ? String(selectedRobot.valor_aluguel) : '0',
                statusOp: selectedRobot.status_operacional || 'disponivel',
                foto: selectedRobot.foto_url || ''
            })
            setIsEditing(false)
        }
    }, [selectedRobot])

    async function handleToggleBlock(robot: Robot) {
        if (!confirm(`Deseja ${robot.status_bloqueio ? 'desbloquear' : 'bloquear'} o robô?`)) return
        await toggleRobotBlock(robot.id, robot.status_bloqueio)
        loadRobots()
        if (selectedRobot?.id === robot.id) {
            setSelectedRobot(prev => prev ? { ...prev, status_bloqueio: !prev.status_bloqueio } : null)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Sidebar List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Frota de Robôs</h2>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Adicionar Novo</h3>
                    <input
                        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Endereço MAC"
                        value={newMac}
                        onChange={e => setNewMac(e.target.value)}
                    />
                    <input
                        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Nome (ex: Tirilo Sala 1)"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <select
                        className="w-full mb-2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm"
                        value={newClinicId}
                        onChange={e => setNewClinicId(e.target.value)}
                        disabled={!!clinicaId} // Disable if scoped to specific clinic
                    >
                        <option value="">Selecione a Clínica...</option>
                        {clinics.map(c => (
                            <option key={c.id} value={c.id}>{c.nome_fantasia}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleRegister}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Registrar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {robots.map(r => (
                        <div
                            key={r.id}
                            onClick={() => setSelectedRobot(r)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRobot?.id === r.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-100 hover:border-gray-300 dark:border-gray-700'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700 dark:text-gray-200">{r.nome_identificacao}</span>
                                <span className={`w-2 h-2 rounded-full ${r.status_bloqueio ? 'bg-red-500' : 'bg-green-500'}`} />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-xs text-gray-500 truncate text-nowrap mr-2">{r.mac_address}</div>
                                {r.id_clinica && (
                                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full truncate max-w-[120px]">
                                        {clinics.find(c => c.id.toString() == r.id_clinica?.toString())?.nome_fantasia || 'Clínica ???'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {robots.length === 0 && <p className="text-gray-400 text-center py-4">Nenhum robô encontrado.</p>}
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full overflow-y-auto">

                {/* GLOBAL CONFIG */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Configuração da Personalidade (Global)</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt do Sistema (Persona)</label>
                            <textarea
                                className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Este prompt define como o robô se comporta em todas as interações.</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveConfig}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Salvar Configuração
                            </button>
                        </div>
                    </div>
                </div>

                {/* SELECTED ROBOT DETAILS */}
                {selectedRobot ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-4 mb-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200">
                                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 border-b border-yellow-200 pb-2 mb-2">Editando Robô</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Basic Info */}
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Nome</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={editForm.nome}
                                                    onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">MAC Address</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm bg-gray-100"
                                                    value={editForm.mac}
                                                    onChange={e => setEditForm({ ...editForm, mac: e.target.value })}
                                                />
                                            </div>

                                            {/* Clinic */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-semibold block mb-1">Clínica Vinculada</label>
                                                <select
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={editForm.clinicaId}
                                                    onChange={e => setEditForm({ ...editForm, clinicaId: e.target.value })}
                                                    disabled={!!clinicaId}
                                                >
                                                    <option value="">Nenhuma (Estoque / Global)</option>
                                                    {clinics.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nome_fantasia}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Hardware Details */}
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Modelo Hardware</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Ex: Raspberry Pi 4 + Case V1"
                                                    value={editForm.modelo}
                                                    onChange={e => setEditForm({ ...editForm, modelo: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Versão Hardware</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Ex: v2.0"
                                                    value={editForm.versao}
                                                    onChange={e => setEditForm({ ...editForm, versao: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Número de Série</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Ex: SN-123456"
                                                    value={editForm.serial}
                                                    onChange={e => setEditForm({ ...editForm, serial: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Status Operacional</label>
                                                <select
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={editForm.statusOp}
                                                    onChange={e => setEditForm({ ...editForm, statusOp: e.target.value })}
                                                >
                                                    <option value="disponivel">Disponível</option>
                                                    <option value="em_uso">Em Uso</option>
                                                    <option value="manutencao">Em Manutenção</option>
                                                    <option value="indisponivel">Indisponível</option>
                                                </select>
                                            </div>

                                            {/* Financials */}
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Valor de Venda (R$)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={editForm.venda}
                                                    onChange={e => setEditForm({ ...editForm, venda: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold block mb-1">Valor de Aluguel (R$)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={editForm.aluguel}
                                                    onChange={e => setEditForm({ ...editForm, aluguel: e.target.value })}
                                                />
                                            </div>

                                            {/* Other */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-semibold block mb-1">Foto URL</label>
                                                <input
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="https://..."
                                                    value={editForm.foto}
                                                    onChange={e => setEditForm({ ...editForm, foto: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-2 border-t border-yellow-200 justify-end">
                                            <button onClick={handleUpdateRobot} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">Salvar Alterações</button>
                                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium hover:bg-gray-500 transition">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-4 mb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                        {selectedRobot.nome_identificacao}

                                                        <span className={`text-xs px-2 py-1 rounded-full border ${selectedRobot.status_operacional === 'disponivel' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            selectedRobot.status_operacional === 'em_uso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                selectedRobot.status_operacional === 'manutencao' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                            }`}>
                                                            {selectedRobot.status_operacional?.toUpperCase() || 'DISPONÍVEL'}
                                                        </span>
                                                    </h2>
                                                    <p className="text-sm text-gray-500 font-mono mt-1">MAC: {selectedRobot.mac_address}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsMaintenanceOpen(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.703-.127 1.5.168 2.372 1.966 2.372 1.966a9.052 9.052 0 0 1-2.401 2.598s-1.83.916-2.429 1.258c-.598.342-1.28.431-1.841.139m-.73-.242a.56.56 0 0 1-.365-.968l2.64-2.64a.56.56 0 0 1 .84.73l-1.076 1.306c-.05.06-.05.151.002.211.336.398.816.638 1.328.627.513-.01.995-.262 1.317-.677l1.325-1.706a.56.56 0 0 0-.256-.855l-1.751-.624a.56.56 0 0 0-.687.202l-1.39 1.792a.56.56 0 0 0 .524.966" />
                                                        </svg>
                                                        Manutenção
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleBlock(selectedRobot)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${selectedRobot.status_bloqueio
                                                                ? 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100'
                                                                : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100'
                                                            }`}
                                                    >
                                                        {selectedRobot.status_bloqueio ? (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                                </svg>
                                                                Desbloquear
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                                </svg>
                                                                Bloquear
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Left Column: Photo & Status */}
                                                <div className="w-full md:w-1/3">
                                                    <div className="aspect-square bg-gray-100 dark:bg-gray-700/30 rounded-lg flex items-center justify-center overflow-hidden border">
                                                        {selectedRobot.foto_url ? (
                                                            <img src={selectedRobot.foto_url} alt="Robô" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-gray-400 text-center p-4">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto mb-2 opacity-50">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                                </svg>
                                                                <span className="text-sm">Sem Foto</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: Specs */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border">
                                                            <p className="text-xs text-gray-500 uppercase font-semibold">Preço Venda</p>
                                                            <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                                                {selectedRobot.valor_venda ?
                                                                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRobot.valor_venda)
                                                                    : 'R$ 0,00'}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border">
                                                            <p className="text-xs text-gray-500 uppercase font-semibold">Preço Aluguel/Mês</p>
                                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                                                {selectedRobot.valor_aluguel ?
                                                                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRobot.valor_aluguel)
                                                                    : 'R$ 0,00'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                                            <span>Clínica Vinculada:</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                {clinics.find(c => c.id.toString() == selectedRobot.id_clinica?.toString())?.nome_fantasia || 'Nenhuma (Estoque Global)'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                                            <span>Modelo Hardware:</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedRobot.modelo_hardware || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                                            <span>Versão:</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedRobot.versao_hardware || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                                            <span>Número de Série:</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedRobot.numero_serie || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Comandos Rápidos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleCommand('FALAR', { texto: 'Olá, amigo!' })} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">🗣️ Dizer Olá</button>
                                    <button onClick={() => handleCommand('JOGAR_CORES')} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">🎨 Jogo Cores</button>
                                    <button onClick={() => handleCommand('JOGAR_EMOCOES')} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">😊 Jogo Emoções</button>
                                    <button onClick={() => handleCommand('MODO_PAPAGAIO')} className="p-2 bg-purple-50 border border-purple-100 text-purple-700 text-sm rounded shadow-sm hover:bg-purple-100 font-medium">🦜 Modo Papagaio</button>
                                    <button onClick={() => handleCommand('MODO_CONVERSA')} className="p-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded shadow-sm hover:bg-blue-100 font-medium">🤖 Conversar (IA)</button>
                                    <button onClick={() => handleCommand('JOGO_PAREAR')} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">🖐️ Jogo Parear (Arrastar)</button>
                                    <button onClick={() => handleCommand('PARAR')} className="p-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded shadow-sm hover:bg-red-100">🛑 Parar Tudo</button>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Enviar Fala</h3>
                                <div className="flex gap-2">
                                    <input id="speakIdx" className="flex-1 p-2 rounded border text-sm" placeholder="Digite o que robô deve falar..." />
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('speakIdx') as HTMLInputElement
                                            if (el.value) { handleCommand('FALAR', { texto: el.value }); el.value = ''; }
                                        }}
                                        className="bg-blue-600 text-white px-3 rounded text-sm"
                                    >Enviar</button>
                                </div>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg mb-3">Telemetria (Ao Vivo)</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                                    <tr>
                                        <th className="p-3">Horário</th>
                                        <th className="p-3">Atividade</th>
                                        <th className="p-3">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {telemetry.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="p-3">{new Date(t.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-3 font-medium">{t.jogo || 'Log'}</td>
                                            <td className="p-3">{t.resultado}</td>
                                        </tr>
                                    ))}
                                    {telemetry.length === 0 && (
                                        <tr><td colSpan={3} className="p-4 text-center text-gray-400">Sem dados recentes.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 h-full">
                        <p className="text-xl font-medium">Selecione um robô para gerenciar</p>
                        <p className="text-sm mt-2">Ou registre um novo dispositivo na lateral.</p>
                    </div>
                )}
            </div>

            <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                    <MaintenancePanel robot={selectedRobot || undefined} onClose={() => setIsMaintenanceOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
