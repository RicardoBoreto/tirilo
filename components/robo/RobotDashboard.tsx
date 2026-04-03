'use client'

import { useState, useEffect, ReactNode } from 'react'
import {
    getRobots,
    getRobotConfig,
    updateRobotConfig,
    sendCommand,
    getTelemetry,
    registerRobot,
    toggleRobotBlock,
    updateRobot,
    getDirectives,
    saveDirective,
    getPerfis,
    savePerfil,
    deletePerfil,
    ativarPerfil,
    type Robot,
    type RobotConfig,
    type Telemetry,
    type PerfilRobo
} from '@/lib/actions/robo'
import { getAllClinics } from '@/lib/actions/clinicas'
import MaintenancePanel from './MaintenancePanel'
import { getLojaJogos } from '@/lib/actions/ludoterapia'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
    Search, Plus, Settings, Play, Shield, Cpu, 
    ExternalLink, Copy, Check, Info, Gamepad2, 
    Wrench, LayoutDashboard, Bug, Radio, 
    Power, Activity, Signal, Terminal, Menu
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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

    // Diretrizes IA (legado)
    const [dirCrianca, setDirCrianca] = useState('')
    const [dirTerapeuta, setDirTerapeuta] = useState('')
    const [isSavingDir, setIsSavingDir] = useState(false)
    const [dirSaveMsg, setDirSaveMsg] = useState('')

    // Perfis de Personalidade
    const [perfis, setPerfis] = useState<PerfilRobo[]>([])
    const [perfilEdit, setPerfilEdit] = useState<Partial<PerfilRobo> | null>(null)
    const [isSavingPerfil, setIsSavingPerfil] = useState(false)
    const [perfilMsg, setPerfilMsg] = useState('')
    const [perfilAtivoId, setPerfilAtivoId] = useState<number | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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
        foto: '',
        tailscaleIp: '',
        sshUser: ''
    })

    // Refactor State
    const [allGames, setAllGames] = useState<any[]>([])
    const [robotSearch, setRobotSearch] = useState('')
    const [appSearch, setAppSearch] = useState('')
    const [appCategoriaFilter, setAppCategoriaFilter] = useState('')
    const [activeTab, setActiveTab] = useState('dashboard')

    useEffect(() => {
        loadRobots()
        loadConfig()
        loadClinics()
        loadDirectives()
        loadPerfis()
        if (clinicaId) loadLoja()
    }, [clinicaId])

    async function loadLoja() {
        if (!clinicaId) return
        const data = await getLojaJogos(parseInt(clinicaId))
        setAllGames(data || [])
    }

    useEffect(() => {
        loadRobots()
        loadConfig()
        loadClinics()
        loadDirectives()
        loadPerfis()
    }, [clinicaId])

    useEffect(() => {
        if (!clinicaId && selectedRobot) {
            loadPerfis()
            if (selectedRobot.id_clinica) {
                getLojaJogos(parseInt(selectedRobot.id_clinica)).then(data => setAllGames(data || []))
            }
        }
    }, [selectedRobot])

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (selectedRobot) {
            loadTelemetry(selectedRobot.mac_address)
            interval = setInterval(() => {
                loadTelemetry(selectedRobot.mac_address, true)
            }, 3000)
        }
        return () => {
            clearInterval(interval)
        }
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

    async function loadDirectives() {
        const data = await getDirectives(clinicaId)
        for (const d of data) {
            if (d.modo === 'CRIANCA') setDirCrianca(d.diretriz)
            if (d.modo === 'TERAPEUTA') setDirTerapeuta(d.diretriz)
        }
    }

    async function loadPerfis() {
        const cid = clinicaId || (selectedRobot?.id_clinica ? String(selectedRobot.id_clinica) : '')
        if (!cid) return
        const data = await getPerfis(cid)
        setPerfis(data)
    }

    async function handleSavePerfil() {
        if (!perfilEdit) return
        const cid = clinicaId || (selectedRobot?.id_clinica ? String(selectedRobot.id_clinica) : '')
        if (!cid) {
            setPerfilMsg('Erro: Selecione um robô para identificar a clínica.')
            return
        }
        setIsSavingPerfil(true)
        setPerfilMsg('')
        try {
            await savePerfil(cid, perfilEdit as Omit<PerfilRobo, 'clinica_id'>)
            setPerfilMsg('Perfil salvo!')
            setPerfilEdit(null)
            await loadPerfis()
            setTimeout(() => setPerfilMsg(''), 3000)
        } catch (e) {
            setPerfilMsg('Erro: ' + e)
        } finally {
            setIsSavingPerfil(false)
        }
    }

    async function handleDeletePerfil(id: number) {
        if (!confirm('Excluir este perfil?')) return
        try {
            await deletePerfil(id)
            await loadPerfis()
        } catch (e) {
            alert('Erro ao excluir: ' + e)
        }
    }

    async function handleAtivarPerfil(perfil: PerfilRobo) {
        if (!selectedRobot) return
        try {
            await ativarPerfil(selectedRobot.mac_address, perfil.id!, selectedRobot.id)
            setPerfilAtivoId(perfil.id!)
            setPerfilMsg(`Perfil "${perfil.nome}" ativado no robô!`)
            setTimeout(() => setPerfilMsg(''), 3000)
        } catch (e) {
            setPerfilMsg('Erro ao ativar: ' + e)
        }
    }

    async function handleSaveDirective(modo: 'CRIANCA' | 'TERAPEUTA', texto: string) {
        setIsSavingDir(true)
        setDirSaveMsg('')
        try {
            await saveDirective(clinicaId ?? null, modo, texto)
            // Envia comando para o robô recarregar as diretrizes imediatamente
            if (selectedRobot) {
                await sendCommand(selectedRobot.mac_address, 'RELOAD_DIRETRIZES')
            }
            setDirSaveMsg(`Diretriz ${modo === 'CRIANCA' ? 'Criança' : 'Terapeuta'} salva!`)
            setTimeout(() => setDirSaveMsg(''), 3000)
        } catch (e) {
            setDirSaveMsg('Erro ao salvar: ' + e)
        } finally {
            setIsSavingDir(false)
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
                foto_url: editForm.foto,
                endereco_tailscale: editForm.tailscaleIp,
                usuario_ssh: editForm.sshUser
            })
            alert('Robô atualizado!')
            setIsEditing(false)
            loadRobots()
            if (selectedRobot) {
                // Refresh optimistic but reloading list is safer
                loadRobots()
            }
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
                foto: selectedRobot.foto_url || '',
                tailscaleIp: selectedRobot.endereco_tailscale || '',
                sshUser: selectedRobot.usuario_ssh || 'pi'
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

    const filteredRobots = robots.filter(r => 
        r.nome_identificacao.toLowerCase().includes(robotSearch.toLowerCase()) ||
        r.mac_address.toLowerCase().includes(robotSearch.toLowerCase())
    )

    const filteredApps = allGames.filter(g => {
        const matchesSearch = !appSearch ||
            g.nome.toLowerCase().includes(appSearch.toLowerCase()) ||
            g.categoria?.toLowerCase().includes(appSearch.toLowerCase())
        const matchesCategoria = !appCategoriaFilter || g.categoria === appCategoriaFilter
        return matchesSearch && matchesCategoria
    })

    function RenderRobotSidebar() {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-primary" />
                        Frota de Robôs
                    </h2>
                    <Badge variant="outline" className="font-mono">{robots.length}</Badge>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou MAC..."
                        className="pl-9"
                        value={robotSearch}
                        onChange={e => setRobotSearch(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 pr-2">
                    <div className="space-y-2">
                        {filteredRobots.map(r => (
                            <div
                                key={r.id}
                                onClick={() => {
                                    setSelectedRobot(r)
                                    setIsDrawerOpen(false)
                                }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all group ${selectedRobot?.id === r.id
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors">
                                        {r.nome_identificacao}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {(new Date().getTime() - new Date(telemetry.find(t => t.mac_address === r.mac_address)?.timestamp || 0).getTime()) < 120000 ? (
                                            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                                        )}
                                        <span className={`w-2 h-2 rounded-full ${r.status_bloqueio ? 'bg-red-500' : 'bg-green-500'}`} title={r.status_bloqueio ? 'Bloqueado' : 'Desbloqueado'} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-[10px] font-mono text-gray-500 truncate">{r.mac_address}</div>
                                    {r.id_clinica && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded uppercase font-bold tracking-tight">
                                            {clinics.find(c => c.id.toString() == r.id_clinica?.toString())?.nome_fantasia?.split(' ')[0] || 'CLÍNICA'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredRobots.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Nenhum robô encontrado.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <Button 
                    variant="outline" 
                    className="mt-4 w-full justify-start gap-2 border-dashed"
                    onClick={() => setActiveTab('novo')}
                >
                    <Plus className="w-4 h-4" />
                    Novo Registro
                </Button>
            </div>
        )
    }

    function RenderDashboardTab() {
        if (!selectedRobot) return (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed">
                <LayoutDashboard className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium">Selecione um robô na lista lateral</p>
                <p className="text-sm">Para visualizar status e comandos rápidos</p>
            </div>
        )

        return (
            <div className="space-y-6">
                {/* Header do Robô Selecionado */}
                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-48 aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden shadow-inner border-4 border-white dark:border-gray-800">
                                {selectedRobot.foto_url ? (
                                    <img src={selectedRobot.foto_url} alt="Robô" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Cpu className="w-16 h-16 opacity-20" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {selectedRobot.nome_identificacao}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
                                                MAC: {selectedRobot.mac_address}
                                            </Badge>
                                            <Badge className={
                                                selectedRobot.status_operacional === 'disponivel' ? 'bg-green-500' :
                                                selectedRobot.status_operacional === 'em_uso' ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }>
                                                {selectedRobot.status_operacional?.toUpperCase() || 'DISPONÍVEL'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsEditing(true)}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button size="sm" variant={selectedRobot.status_bloqueio ? "destructive" : "outline"} className="flex-1 sm:flex-none" onClick={() => handleToggleBlock(selectedRobot)}>
                                            <Shield className="w-4 h-4 mr-2" />
                                            {selectedRobot.status_bloqueio ? "Desbloquear" : "Bloquear"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status Rede</p>
                                        <div className="flex items-center gap-2">
                                            {(new Date().getTime() - new Date(telemetry[0]?.timestamp || 0).getTime()) < 120000 ? (
                                                <Badge className="bg-green-500/10 text-green-600 border-green-200">Online</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400">Offline</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-gray-400 hover:text-indigo-600"
                                                title="Verificar se o robô está ativo"
                                                onClick={() => handleCommand('PING')}
                                            >
                                                <Signal className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Firmware</p>
                                        <p className="font-mono font-bold text-indigo-600">v{selectedRobot.versao_firmware || '1.0'}</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Bateria</p>
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-green-500" />
                                            <p className="font-bold">100%</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Sessão</p>
                                        <p className="font-bold text-blue-600">Ativa</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Comandos Rápidos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-primary" />
                                Comandos Rápidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => handleCommand('MODO_CRIANCA')} className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 hover:bg-green-100">🧒 Modo Criança</Button>
                                <Button onClick={() => handleCommand('MODO_TERAPEUTA')} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-100">🩺 Modo Terapeuta</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleCommand('MODO_PAPAGAIO')}>🦜 Papagaio</Button>
                                <Button variant="outline" size="sm" onClick={() => handleCommand('MODO_CONVERSA')}>🤖 Conversar</Button>
                            </div>
                            <Button variant="destructive" className="w-full shadow-lg shadow-red-500/10" onClick={() => handleCommand('PARAR')}>
                                <Power className="w-4 h-4 mr-2" />
                                Parar Todas as Atividades
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Enviar Fala */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Radio className="w-5 h-5 text-primary" />
                                Voz do Robô
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input id="speakIdx" placeholder="Digite o que o Tirilo deve falar..." />
                                <Button onClick={() => {
                                    const el = document.getElementById('speakIdx') as HTMLInputElement
                                    if (el.value) { handleCommand('FALAR', { texto: el.value }); el.value = ''; }
                                }}>Enviar</Button>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleCommand('FALAR', { texto: 'Olá, como você está hoje?' })}>Dizer Olá</Button>
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleCommand('FALAR', { texto: 'Parabéns, você conseguiu!' })}>Parabenizar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Telemetria Simplificada */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Signal className="w-5 h-5 text-primary" />
                            Atividade Recente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {telemetry.slice(0, 5).map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <Play className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{t.jogo || 'Ação do Sistema'}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(t.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{t.resultado}</Badge>
                                </div>
                            ))}
                            {telemetry.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">Sem atividades registradas.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    function RenderNewRobotTab() {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-6 h-6 text-primary" />
                        Registrar Novo Robô Tirilo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Preencha as informações técnicas fornecidas na etiqueta do dispositivo para vinculá-lo à frota.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Endereço MAC</label>
                            <Input
                                placeholder="00:00:00:00:00:00"
                                value={newMac}
                                onChange={e => setNewMac(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Nome de Identificação</label>
                            <Input
                                placeholder="Ex: Tirilo - Sala 01"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Clínica de Destino</label>
                        <select
                            className="w-full p-2 rounded-lg border bg-white dark:bg-gray-800"
                            value={newClinicId}
                            onChange={e => setNewClinicId(e.target.value)}
                            disabled={!!clinicaId}
                        >
                            <option value="">Nenhuma (Estoque / Global)</option>
                            {clinics.map(c => (
                                <option key={c.id} value={c.id}>{c.nome_fantasia}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-4">
                        <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20" onClick={handleRegister}>
                            Finalizar Registro
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    function RenderConfigTab() {
        return (
            <div className="space-y-6">
                 {/* GLOBAL CONFIG */}
                 <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-indigo-500" />
                                Personalidade Global da IA
                            </h2>
                            <Button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto h-9 sm:h-10 font-bold">
                                <Check className="w-4 h-4 mr-2" />
                                Salvar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 flex items-start gap-3">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Este prompt define o comportamento base do robô para toda a clínica.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">Prompt do Sistema (Persona)</label>
                            <textarea
                                className="w-full p-3 sm:p-4 rounded-xl border dark:bg-gray-900 min-h-[100px] sm:min-h-[150px] shadow-inner focus:ring-2 focus:ring-primary/20 transition-all outline-none text-xs sm:text-sm font-medium leading-relaxed"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Você é o Robô Tirilo, um assistente lúdico para crianças..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* DIRETRIZES IA */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="p-4 sm:p-6 border-b dark:border-gray-800">
                        <CardTitle className="text-base sm:text-xl font-black flex items-center gap-2">
                            <Bug className="w-5 h-5 text-primary" />
                            Diretrizes de Atuação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Modo Criança */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs sm:text-sm font-black text-green-600 flex items-center gap-2 uppercase tracking-wider">
                                        🧒 Modo Criança
                                    </label>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => handleSaveDirective('CRIANCA', dirCrianca)}>Salvar</Button>
                                </div>
                                <textarea
                                    value={dirCrianca}
                                    onChange={e => setDirCrianca(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl border dark:bg-gray-900 text-[11px] sm:text-xs font-mono shadow-inner outline-none focus:ring-2 focus:ring-green-400/20 leading-relaxed"
                                    placeholder="Instruções para interação infantil..."
                                />
                            </div>
                            {/* Modo Terapeuta */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs sm:text-sm font-black text-indigo-600 flex items-center gap-2 uppercase tracking-wider">
                                        🩺 Modo Terapeuta
                                    </label>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => handleSaveDirective('TERAPEUTA', dirTerapeuta)}>Salvar</Button>
                                </div>
                                <textarea
                                    value={dirTerapeuta}
                                    onChange={e => setDirTerapeuta(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl border dark:bg-gray-900 text-[11px] sm:text-xs font-mono shadow-inner outline-none focus:ring-2 focus:ring-indigo-400/20 leading-relaxed"
                                    placeholder="Instruções para auxílio profissional..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PERFIS DE PERSONALIDADE */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-primary" />
                                Perfis de Personalidade
                            </CardTitle>
                            <Button size="sm" onClick={() => setPerfilEdit({ nome: '', descricao: '', prompt_instrucao: '', modo_base: 'CRIANCA', ativo: true })}>
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Novo Perfil</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {perfis.map(p => (
                                <Card key={p.id} className={`group hover:border-primary/50 transition-all ${perfilAtivoId === p.id ? 'border-primary bg-primary/5' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={p.modo_base === 'TERAPEUTA' ? "secondary" : "outline"} className="text-[9px]">
                                                {p.modo_base}
                                            </Badge>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPerfilEdit({ ...p })}><Settings className="w-3 h-3" /></Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDeletePerfil(p.id!)}>✕</Button>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-sm truncate">{p.nome}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[2.5rem]">{p.descricao || 'Sem descrição.'}</p>
                                        <Button 
                                            size="sm" 
                                            className="w-full mt-4 h-8" 
                                            variant={perfilAtivoId === p.id ? "default" : "outline"}
                                            onClick={() => handleAtivarPerfil(p)}
                                            disabled={!selectedRobot}
                                        >
                                            {perfilAtivoId === p.id ? "Perfil Ativo" : "Ativar no Robô"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {perfis.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400">
                                    <p className="text-sm">Nenhum perfil personalizado cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL DE EDIÇÃO DE PERFIL */}
                <Dialog open={!!perfilEdit} onOpenChange={(open) => { if (!open) setPerfilEdit(null) }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{perfilEdit?.id ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nome do Perfil</label>
                                <Input
                                    placeholder="Ex: Animado, Calmo, Formal..."
                                    value={perfilEdit?.nome || ''}
                                    onChange={e => setPerfilEdit(p => ({ ...p!, nome: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Descrição</label>
                                <Input
                                    placeholder="Breve descrição do perfil..."
                                    value={perfilEdit?.descricao || ''}
                                    onChange={e => setPerfilEdit(p => ({ ...p!, descricao: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Modo Base</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={perfilEdit?.modo_base === 'CRIANCA' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setPerfilEdit(p => ({ ...p!, modo_base: 'CRIANCA' }))}
                                    >
                                        🧒 Criança
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={perfilEdit?.modo_base === 'TERAPEUTA' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setPerfilEdit(p => ({ ...p!, modo_base: 'TERAPEUTA' }))}
                                    >
                                        🩺 Terapeuta
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Prompt de Personalidade</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border dark:bg-gray-900 min-h-[140px] text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none"
                                    placeholder="Descreva a personalidade e comportamento do robô neste perfil..."
                                    value={perfilEdit?.prompt_instrucao || ''}
                                    onChange={e => setPerfilEdit(p => ({ ...p!, prompt_instrucao: e.target.value }))}
                                />
                            </div>
                            {perfilMsg && (
                                <p className={`text-sm font-medium ${perfilMsg.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>
                                    {perfilMsg}
                                </p>
                            )}
                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" className="flex-1" onClick={() => setPerfilEdit(null)}>
                                    Cancelar
                                </Button>
                                <Button className="flex-1" onClick={handleSavePerfil} disabled={isSavingPerfil || !perfilEdit?.nome}>
                                    {isSavingPerfil ? 'Salvando...' : 'Salvar Perfil'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    function RenderAppsTab() {
        const categorias = [...new Set(allGames.map(g => g.categoria).filter(Boolean))] as string[]

        const categoryStyle: Record<string, { icon: ReactNode, bg: string, text: string, border: string, label: string }> = {
            'JOGO': {
                icon: <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-600',
                border: 'hover:border-blue-200',
                label: 'LudoTirilo: Jogos e Interações',
            },
            'FERRAMENTA': {
                icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />,
                bg: 'bg-orange-100 dark:bg-orange-900/30',
                text: 'text-orange-600',
                border: 'hover:border-orange-200',
                label: 'Configurações e Diagnóstico',
            },
        }
        const defaultStyle = {
            icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />,
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600',
            border: 'hover:border-purple-200',
            label: '',
        }

        return (
            <div className="space-y-8">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    className="pl-10 h-10 sm:h-12 text-sm sm:text-lg bg-white dark:bg-gray-900 border-none shadow-sm"
                                    placeholder="Busca rápida..."
                                    value={appSearch}
                                    onChange={e => setAppSearch(e.target.value)}
                                />
                            </div>
                            <Select
                                value={appCategoriaFilter || '__all__'}
                                onValueChange={v => setAppCategoriaFilter(v === '__all__' ? '' : v)}
                            >
                                <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12 bg-white dark:bg-gray-900 border-none shadow-sm text-sm sm:text-base">
                                    <SelectValue placeholder="Todas as categorias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas as categorias</SelectItem>
                                    {categorias.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {categorias.map(cat => {
                    const items = filteredApps.filter(a => a.categoria === cat)
                    if (items.length === 0) return null
                    const style = categoryStyle[cat] || defaultStyle
                    const isJogo = cat === 'JOGO'

                    return (
                        <div key={cat} className="space-y-4">
                            <h3 className="text-lg sm:text-2xl font-black flex items-center gap-3 text-gray-800 dark:text-white px-1">
                                <div className={`p-1.5 sm:p-2 ${style.bg} rounded-lg sm:rounded-xl`}>
                                    {style.icon}
                                </div>
                                {style.label || cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </h3>

                            {isJogo ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {items.map(game => (
                                        <Card key={game.id} className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none bg-white dark:bg-gray-800 shadow-sm">
                                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                {game.thumbnail_url ? (
                                                    <img src={game.thumbnail_url} alt={game.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 opacity-10" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                                    <Badge className="bg-white/20 backdrop-blur-md border-none text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">
                                                        v{game.versao_atual || '1.0'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-3 sm:p-4 space-y-3">
                                                <h4 className="font-bold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors truncate">{game.nome}</h4>
                                                <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed">{game.descricao_regras || 'Interação lúdica com o Robô Tirilo.'}</p>
                                                <Button
                                                    className="w-full h-9 sm:h-10 font-bold tracking-wide text-xs sm:text-sm"
                                                    onClick={() => handleCommand(game.comando_entrada || 'START_GAME', { game_id: game.id })}
                                                    disabled={!selectedRobot}
                                                >
                                                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2 fill-current" />
                                                    INICIAR AGORA
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {items.map(item => (
                                        <Card key={item.id} className={`bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors border-dashed hover:border-solid ${style.border}`}>
                                            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${style.bg} flex items-center justify-center ${style.text} shrink-0`}>
                                                    <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-xs sm:text-sm truncate">{item.nome}</h4>
                                                    <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{item.comando_entrada}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                                                    onClick={() => handleCommand(item.comando_entrada || 'SYSTEM_TOOL')}
                                                    disabled={!selectedRobot}
                                                >
                                                    Executar
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Fallback: CALIBRAR_OLHOS se não cadastrado no banco */}
                {!allGames.some(g => g.comando_entrada === 'CALIBRAR_OLHOS') && (!appCategoriaFilter || appCategoriaFilter === 'FERRAMENTA') && (
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-2xl font-black flex items-center gap-3 text-gray-800 dark:text-white px-1">
                            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg sm:rounded-xl">
                                <Bug className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                            </div>
                            Diagnóstico
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <Card className="bg-gray-50 dark:bg-gray-800/50 border-dashed border-gray-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                                        <Bug className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">Calibração de Atuadores</h4>
                                        <p className="text-[10px] text-gray-500">Ajuste fino de servos e LEDs</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => handleCommand('CALIBRAR_OLHOS')} disabled={!selectedRobot}>Abrir</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    function RenderEditForm() {
        if (!selectedRobot) return null;

        return (
            <div className="space-y-4 mb-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 border-b border-yellow-200 pb-2 mb-2">Editando Robô</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Nome</label>
                        <Input
                            className="bg-white dark:bg-gray-800"
                            value={editForm.nome}
                            onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">MAC Address</label>
                        <Input
                            className="bg-gray-100 dark:bg-gray-900"
                            value={editForm.mac}
                            onChange={e => setEditForm({ ...editForm, mac: e.target.value })}
                            readOnly
                        />
                    </div>

                    {/* Clinic selection */}
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Clínica Vinculada</label>
                        <select
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800"
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

                    {/* Specs */}
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Modelo Hardware</label>
                        <Input
                            className="bg-white dark:bg-gray-800"
                            placeholder="Ex: Raspberry Pi 4"
                            value={editForm.modelo}
                            onChange={e => setEditForm({ ...editForm, modelo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Versão Hardware</label>
                        <Input
                            className="bg-white dark:bg-gray-800"
                            placeholder="Ex: v2.0"
                            value={editForm.versao}
                            onChange={e => setEditForm({ ...editForm, versao: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Número de Série</label>
                        <Input
                            className="bg-white dark:bg-gray-800"
                            placeholder="Ex: SN-123456"
                            value={editForm.serial}
                            onChange={e => setEditForm({ ...editForm, serial: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Status Operacional</label>
                        <select
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800"
                            value={editForm.statusOp}
                            onChange={e => setEditForm({ ...editForm, statusOp: e.target.value })}
                        >
                            <option value="disponivel">Disponível</option>
                            <option value="em_uso">Em Uso</option>
                            <option value="manutencao">Em Manutenção</option>
                            <option value="indisponivel">Indisponível</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 pt-2 border-t border-yellow-200 mt-2">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase mb-2">Conectividade (Admin)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold block mb-1">Tailscale IP</label>
                                <Input
                                    className="font-mono text-xs bg-white dark:bg-gray-800"
                                    value={editForm.tailscaleIp}
                                    onChange={e => setEditForm({ ...editForm, tailscaleIp: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Usuário SSH</label>
                                <Input
                                    className="font-mono text-xs bg-white dark:bg-gray-800"
                                    value={editForm.sshUser}
                                    onChange={e => setEditForm({ ...editForm, sshUser: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-4 pt-2 border-t border-yellow-200 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateRobot} className="bg-green-600 hover:bg-green-700 text-white">Salvar Alterações</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-140px)] overflow-y-auto lg:overflow-hidden p-2 lg:p-0 pb-24 lg:pb-0">
            {/* Sidebar Desktop (Contexto do Robô) */}
            <div className="hidden lg:block w-80 shrink-0">
                {RenderRobotSidebar()}
            </div>

            {/* Mobile Header with Drawer Trigger */}
            <div className="lg:hidden flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm leading-tight">Gestão de Robôs</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{selectedRobot?.nome_identificacao || 'Nenhum Selecionado'}</p>
                    </div>
                </div>

                <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                            <Menu className="w-5 h-5" />
                            {!selectedRobot && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-primary" />
                                Lista de Robôs
                            </SheetTitle>
                        </SheetHeader>
                        <div className="h-[calc(100vh-80px)]">
                            {RenderRobotSidebar()}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content Area (Abas) */}
            <div className="flex-1 min-w-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    {/* Header de Abas Desktop */}
                    <div className="hidden lg:flex items-center justify-between mb-4 bg-white dark:bg-gray-800 p-2 rounded-xl border shadow-sm">
                        <TabsList className="bg-transparent border-none">
                            <TabsTrigger value="dashboard" className="gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Painel</span>
                            </TabsTrigger>
                            <TabsTrigger value="novo" className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Novo Robô</span>
                            </TabsTrigger>
                            <TabsTrigger value="config" className="gap-2">
                                <Settings className="w-4 h-4" />
                                <span>IA & Perfil</span>
                            </TabsTrigger>
                            <TabsTrigger value="apps" className="gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                <span>Aplicativos</span>
                            </TabsTrigger>
                        </TabsList>
                        
                        {selectedRobot && (
                            <div className="flex items-center gap-3 pr-4">
                                <div className="text-right">
                                    <p className="text-xs font-bold leading-tight">{selectedRobot.nome_identificacao}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">{selectedRobot.mac_address}</p>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full ${selectedRobot.status_bloqueio ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                            </div>
                        )}
                    </div>

                    {/* Navbar Mobile (Fixa no Rodapé) */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-1 pb-safe pt-1 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                        <TabsList className="grid grid-cols-4 w-full bg-transparent gap-0 h-16">
                            <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-0.5 h-full w-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none bg-transparent transition-all p-0">
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="text-[10px] font-bold leading-none">Painel</span>
                            </TabsTrigger>
                            <TabsTrigger value="novo" className="flex flex-col items-center justify-center gap-0.5 h-full w-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none bg-transparent transition-all p-0">
                                <Plus className="w-5 h-5" />
                                <span className="text-[10px] font-bold leading-none">Novo</span>
                            </TabsTrigger>
                            <TabsTrigger value="config" className="flex flex-col items-center justify-center gap-0.5 h-full w-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none bg-transparent transition-all p-0">
                                <Settings className="w-5 h-5" />
                                <span className="text-[10px] font-bold leading-none">IA</span>
                            </TabsTrigger>
                            <TabsTrigger value="apps" className="flex flex-col items-center justify-center gap-0.5 h-full w-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none bg-transparent transition-all p-0">
                                <Gamepad2 className="w-5 h-5" />
                                <span className="text-[10px] font-bold leading-none">Apps</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 lg:pr-4 lg:-mr-4">
                        <div className="pb-10 lg:pb-0">
                            <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
                                {RenderDashboardTab()}
                            </TabsContent>
                            <TabsContent value="novo" className="m-0 focus-visible:outline-none">
                                {RenderNewRobotTab()}
                            </TabsContent>
                            <TabsContent value="config" className="m-0 focus-visible:outline-none">
                                {RenderConfigTab()}
                            </TabsContent>
                            <TabsContent value="apps" className="m-0 focus-visible:outline-none">
                                {RenderAppsTab()}
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </div>

            {/* Dialogs */}
            <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                    <MaintenancePanel robot={selectedRobot || undefined} onClose={() => setIsMaintenanceOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl">
                    {RenderEditForm()}
                </DialogContent>
            </Dialog>
        </div>
    )
}
