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
    type Robot,
    type RobotConfig,
    type Telemetry
} from '@/lib/actions/robo'

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

    useEffect(() => {
        loadRobots()
        loadConfig()
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
            await registerRobot(newMac, newName, clinicaId)
            setNewMac('')
            setNewName('')
            loadRobots()
        } catch (e) {
            alert('Erro ao registrar: ' + e)
        }
    }

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
                            <div className="text-xs text-gray-500 truncate">{r.mac_address}</div>
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
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedRobot.nome_identificacao}</h2>
                                <p className="text-sm text-gray-500">MAC: {selectedRobot.mac_address}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleBlock(selectedRobot)}
                                    className={`px-3 py-1 rounded text-sm font-medium ${selectedRobot.status_bloqueio ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                >
                                    {selectedRobot.status_bloqueio ? 'Desbloquear' : 'Bloquear'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Comandos Rápidos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleCommand('FALAR', { texto: 'Olá, amigo!' })} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">🗣️ Dizer Olá</button>
                                    <button onClick={() => handleCommand('JOGAR_CORES')} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">🎨 Jogo Cores</button>
                                    <button onClick={() => handleCommand('JOGAR_EMOCOES')} className="p-2 bg-white border text-sm rounded shadow-sm hover:bg-gray-50">😊 Jogo Emoções</button>
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
        </div>
    )
}
