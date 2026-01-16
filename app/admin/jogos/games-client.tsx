'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { Game, GameVersion, ClinicPermission, createGame, updateGame, toggleGameStatus, deleteGame, getGameVersions, getGamePermissions, updateGamePermission } from '@/lib/actions/games'
import { Habilidade, getHabilidades, getHabilidadesDoJogo, vincularHabilidadeJogo, desvincularHabilidadeJogo, createHabilidade } from '@/lib/actions/ludoterapia'
import { MoreHorizontal, Plus, Search, Edit, Trash, Power, Gamepad2, Upload, History, Rocket, Eye, Store, CheckCircle, XCircle, Brain, X } from 'lucide-react'
import { format } from 'date-fns'

export default function GamesClient({ initialGames }: { initialGames: Game[] }) {
    const [games, setGames] = useState<Game[]>(initialGames)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [editingGame, setEditingGame] = useState<Game | null>(null)
    const [gameVersions, setGameVersions] = useState<GameVersion[]>([])
    const [clinicPermissions, setClinicPermissions] = useState<ClinicPermission[]>([])
    const [allHabilidades, setAllHabilidades] = useState<Habilidade[]>([])
    const [gameHabilidades, setGameHabilidades] = useState<any[]>([])

    // New Habilidade UI State
    const [newHabilidadeNome, setNewHabilidadeNome] = useState('')
    const [selectedHabilidadeId, setSelectedHabilidadeId] = useState('')
    const [selectedImpacto, setSelectedImpacto] = useState('5')

    const [searchTerm, setSearchTerm] = useState('')
    const [clinicSearchTerm, setClinicSearchTerm] = useState('')
    const [isReadOnly, setIsReadOnly] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        setGames(initialGames)
    }, [initialGames])

    const filteredGames = games.filter(game =>
        game.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.categoria && game.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    async function handleOpenEdit(game: Game) {
        setEditingGame(game)
        setIsReadOnly(false)
        setIsLoading(true)

        // Parallel data fetching
        const [perms, habs, gameHabs] = await Promise.all([
            getGamePermissions(game.id),
            getHabilidades(),
            getHabilidadesDoJogo(game.id)
        ])

        setClinicPermissions(perms)
        setAllHabilidades(habs)
        setGameHabilidades(gameHabs)

        setIsLoading(false)
        setIsOpen(true)
    }

    async function handleOpenView(game: Game) {
        setEditingGame(game)
        setIsReadOnly(true)
        setIsLoading(true)

        const [perms, habs, gameHabs] = await Promise.all([
            getGamePermissions(game.id),
            getHabilidades(),
            getHabilidadesDoJogo(game.id)
        ])

        setClinicPermissions(perms)
        setAllHabilidades(habs)
        setGameHabilidades(gameHabs)

        setIsLoading(false)
        setIsOpen(true)
    }

    async function handleGrantChange(clinicId: string, grant: boolean) {
        if (!editingGame) return;

        // Optimistic update
        setClinicPermissions(prev => prev.map(p =>
            p.clinica_id === clinicId ? { ...p, tem_acesso: grant } : p
        ))

        const result = await updateGamePermission(editingGame.id, clinicId, grant)
        if (result?.error) {
            console.error('Grant Change Error:', result.error)
            toast({
                title: 'Erro',
                description: (
                    <div className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white break-all whitespace-pre-wrap font-mono text-xs">
                            {result.error}
                        </code>
                    </div>
                ),
                variant: 'destructive'
            })
            // Revert
            setClinicPermissions(prev => prev.map(p =>
                p.clinica_id === clinicId ? { ...p, tem_acesso: !grant } : p
            ))
        }
    }

    // --- Habilidades Handlers ---

    async function handleAddHabilidade() {
        if (!editingGame || !selectedHabilidadeId) return

        setIsLoading(true)
        const result = await vincularHabilidadeJogo(editingGame.id, selectedHabilidadeId, parseInt(selectedImpacto))

        if (result.error) {
            toast({ title: 'Erro ao vincular', description: result.error, variant: 'destructive' })
        } else {
            // Refresh list
            const updated = await getHabilidadesDoJogo(editingGame.id)
            setGameHabilidades(updated)
            toast({ title: 'Sucesso', description: 'Competência vinculada.' })
        }
        setIsLoading(false)
    }

    async function handleCreateAndAddHabilidade() {
        if (!editingGame || !newHabilidadeNome) return

        const formData = new FormData()
        formData.append('nome', newHabilidadeNome)
        formData.append('codigo_ia', newHabilidadeNome.toLowerCase().replace(/\s+/g, '_'))

        setIsLoading(true)
        const createRes = await createHabilidade(formData)

        if (createRes.error) {
            toast({ title: 'Erro ao criar', description: createRes.error, variant: 'destructive' })
            setIsLoading(false)
            return
        }

        // Reload all skills to get ID
        const habs = await getHabilidades()
        setAllHabilidades(habs)
        const newHab = habs.find(h => h.nome === newHabilidadeNome)

        if (newHab) {
            const result = await vincularHabilidadeJogo(editingGame.id, newHab.id, 5)
            if (result.error) {
                toast({ title: 'Erro ao vincular', description: result.error, variant: 'destructive' })
            } else {
                const updated = await getHabilidadesDoJogo(editingGame.id)
                setGameHabilidades(updated)
                setNewHabilidadeNome('')
                toast({ title: 'Sucesso', description: 'Competência criada e vinculada.' })
            }
        }
        setIsLoading(false)
    }

    async function handleRemoveHabilidade(habilidadeId: string) {
        if (!editingGame) return

        setIsLoading(true)
        const result = await desvincularHabilidadeJogo(editingGame.id, habilidadeId)

        if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' })
        } else {
            setGameHabilidades(prev => prev.filter(h => h.id !== habilidadeId))
        }
        setIsLoading(false)
    }

    async function handleOpenHistory(game: Game) {
        setEditingGame(game)
        setIsLoading(true)
        const versions = await getGameVersions(game.id)
        setGameVersions(versions)
        setIsLoading(false)
        setIsHistoryOpen(true)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(event.currentTarget)

            if (editingGame) {
                const result = await updateGame(editingGame.id, formData)
                if (result.error) throw new Error(result.error)
                toast({ title: 'Sucesso', description: 'Jogo atualizado com sucesso.' })
            } else {
                const result = await createGame(formData)
                if (result.error) throw new Error(result.error)
                toast({ title: 'Sucesso', description: 'Jogo criado com sucesso.' })
            }

            setIsOpen(false)
            setEditingGame(null)
            router.refresh()
        } catch (error: any) {
            console.error('Erro ao salvar jogo:', error)

            toast({
                title: 'Erro ao executar operação',
                description: (
                    <div className="flex flex-col gap-2 mt-2 w-full">
                        <p className="text-sm font-medium text-white">Detalhes do Erro:</p>
                        <div className="rounded bg-black/50 p-3 font-mono text-xs text-white border border-white/20 w-full overflow-x-auto select-all cursor-text whitespace-pre-wrap break-all">
                            {error.message || JSON.stringify(error)}
                        </div>
                    </div>
                ),
                variant: 'destructive',
                duration: 20000,
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleStatus(game: Game) {
        try {
            const result = await toggleGameStatus(game.id, game.ativo)
            if (result.error) throw new Error(result.error)

            // Optimistic update
            setGames(games.map(g => g.id === game.id ? { ...g, ativo: !g.ativo } : g))

            toast({ title: 'Status atualizado', description: `Jogo ${!game.ativo ? 'ativado' : 'desativado'}.` })
            router.refresh()
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gerenciar Jogos</h2>
                    <p className="text-muted-foreground">Administre os jogos e suas versões na frota de robôs.</p>
                </div>
                <Button onClick={() => { setEditingGame(null); setIsReadOnly(false); setIsOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Jogo
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou categoria..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Jogo</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Versão</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Preço</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Categoria</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Comando (Script)</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGames.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    Nenhum jogo encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredGames.map((game) => (
                                <tr key={game.id} className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex-shrink-0 border">
                                                {game.thumbnail_url ? (
                                                    <Image
                                                        src={game.thumbnail_url}
                                                        alt={game.nome}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full">
                                                        <Gamepad2 className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{game.nome}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">{game.versao_atual}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            v{game.versao_atual}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {game.preco > 0 ? (
                                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(game.preco)}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                Grátis
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-200">
                                            {game.categoria || 'Geral'}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell font-mono text-xs text-gray-500">
                                        {game.comando_entrada || '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${game.ativo
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {game.ativo ? 'Ativo' : 'Inativo'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleOpenView(game)} title="Visualizar">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleOpenEdit(game)} title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20" onClick={() => handleOpenHistory(game)} title="Histórico de Versões">
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${game.ativo ? 'text-green-600 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                onClick={() => handleToggleStatus(game)}
                                                title={game.ativo ? "Desativar" : "Ativar"}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isReadOnly ? 'Visualizar Jogo' : (editingGame ? 'Editar Jogo' : 'Novo Jogo')}</DialogTitle>
                        <DialogDescription>
                            {isReadOnly ? 'Detalhes do jogo.' : (editingGame ? 'Gerencie os detalhes do jogo ou lance uma nova versão.' : 'Adicione um novo jogo para a frota.')}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="details">Detalhes</TabsTrigger>
                            <TabsTrigger value="competencies" disabled={!editingGame}>Competências</TabsTrigger>
                            <TabsTrigger value="distribution" disabled={!editingGame}>Distribuição</TabsTrigger>
                            {!isReadOnly && editingGame && <TabsTrigger value="update">Atualizar</TabsTrigger>}
                        </TabsList>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <TabsContent value="details" forceMount={true} className="space-y-4 data-[state=inactive]:hidden">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nome">Nome do Jogo</Label>
                                        <Input id="nome" name="nome" required defaultValue={editingGame?.nome} placeholder="Ex: Parear Cores" disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="categoria">Categoria</Label>
                                        <Input id="categoria" name="categoria" defaultValue={editingGame?.categoria || ''} placeholder="Ex: Educativo, Motor" disabled={isReadOnly} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comando_entrada">Comando / Script (Python Path)</Label>
                                    <Input id="comando_entrada" name="comando_entrada" required defaultValue={editingGame?.comando_entrada || ''} placeholder="Ex: games.parear_cor" disabled={isReadOnly} />
                                    <p className="text-xs text-muted-foreground">Caminho do módulo python ou identificador do comando.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="descricao_regras">Regras do Jogo</Label>
                                    <Textarea id="descricao_regras" name="descricao_regras" className="h-24" defaultValue={editingGame?.descricao_regras || ''} placeholder="Descreva como jogar..." disabled={isReadOnly} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="indicacao">Indicação (Público Alvo)</Label>
                                    <Textarea id="indicacao" name="indicacao" className="h-20" defaultValue={editingGame?.indicacao || ''} placeholder="Para quem é indicado este jogo?" disabled={isReadOnly} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thumbnail">Thumbnail (Imagem)</Label>
                                    <div className="flex items-center gap-4">
                                        {editingGame?.thumbnail_url && (
                                            <div className="h-16 w-16 relative rounded border overflow-hidden shrink-0">
                                                <Image src={editingGame.thumbnail_url} alt="Current" fill className="object-cover" />
                                            </div>
                                        )}
                                        {!isReadOnly && <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />}
                                    </div>
                                    <input type="hidden" name="thumbnail_url" value={editingGame?.thumbnail_url || ''} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="preco">Preço (R$)</Label>
                                    <Input
                                        id="preco"
                                        name="preco"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={editingGame?.preco || 0}
                                        disabled={isReadOnly}
                                        className="font-mono bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 font-bold"
                                    />
                                    <p className="text-xs text-muted-foreground">Valor da licença do jogo. Digite 0 para tornar gratuito.</p>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="ativo" name="ativo" defaultChecked={editingGame ? editingGame.ativo : true} value="true" disabled={isReadOnly} />
                                    <Label htmlFor="ativo">Jogo Ativo (Visível na lista de seleção)</Label>
                                </div>
                            </TabsContent>

                            <TabsContent value="competencies" forceMount={true} className="space-y-4 data-[state=inactive]:hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Brain className="w-4 h-4" />
                                        Habilidades Trabalhadas
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Defina quais competências este jogo estimula. Isso será usado pela IA para sugerir atividades.
                                    </p>

                                    {!isReadOnly && (
                                        <div className="flex flex-col gap-3 p-3 bg-white dark:bg-gray-950 rounded border">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Select value={selectedHabilidadeId} onValueChange={setSelectedHabilidadeId}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione ou crie..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allHabilidades.map(h => (
                                                                <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Input
                                                    className="w-20"
                                                    type="number"
                                                    min="1" max="10"
                                                    value={selectedImpacto}
                                                    onChange={e => setSelectedImpacto(e.target.value)}
                                                    placeholder="Nível"
                                                    title="Nível de Impacto (1-10)"
                                                />
                                                <Button type="button" size="sm" onClick={handleAddHabilidade} disabled={!selectedHabilidadeId || isLoading}>
                                                    Adicionar
                                                </Button>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">Ou crie nova</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Nome da habilidade (ex: Motricidade)"
                                                    value={newHabilidadeNome}
                                                    onChange={e => setNewHabilidadeNome(e.target.value)}
                                                />
                                                <Button type="button" size="sm" variant="outline" onClick={handleCreateAndAddHabilidade} disabled={!newHabilidadeNome || isLoading}>
                                                    Criar & Vincular
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        {gameHabilidades.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground bg-white dark:bg-gray-950 rounded border border-dashed">
                                                Nenhuma competência vinculada.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {gameHabilidades.map((gh) => (
                                                    <div key={gh.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 border rounded shadow-sm">
                                                        <div>
                                                            <div className="font-medium text-sm">{gh.nome}</div>
                                                            <div className="text-xs text-blue-600 dark:text-blue-400">Impacto: {gh.nivel_impacto}/10</div>
                                                        </div>
                                                        {!isReadOnly && (
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveHabilidade(gh.id)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="distribution" forceMount={true} className="space-y-4 data-[state=inactive]:hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Store className="w-4 h-4" />
                                        Distribuição e Licenças
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Gerencie quais clínicas possuem acesso a este jogo.
                                    </p>

                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar clínica..."
                                            className="pl-8 mb-2"
                                            value={clinicSearchTerm}
                                            onChange={(e) => setClinicSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <ScrollArea className="h-[300px] border rounded-md bg-white dark:bg-gray-950 p-2">
                                        {clinicPermissions.filter(c => c.nome_clinica.toLowerCase().includes(clinicSearchTerm.toLowerCase())).length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">Nenhuma clínica encontrada.</div>
                                        ) : (
                                            <div className="space-y-1">
                                                {clinicPermissions
                                                    .filter(c => c.nome_clinica.toLowerCase().includes(clinicSearchTerm.toLowerCase()))
                                                    .map((clinic) => (
                                                        <div key={clinic.clinica_id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md">
                                                            <span className="text-sm font-medium">{clinic.nome_clinica}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={clinic.tem_acesso}
                                                                    onCheckedChange={(checked) => handleGrantChange(clinic.clinica_id, checked)}
                                                                    disabled={isReadOnly}
                                                                />
                                                                <span className={`text-xs w-16 ${clinic.tem_acesso ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                                                    {clinic.tem_acesso ? 'Liberado' : 'Bloqueado'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </TabsContent>

                            <TabsContent value="update" forceMount={true} className="space-y-4 data-[state=inactive]:hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Rocket className="w-4 h-4" />
                                        Lançar Nova Versão
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Versão Atual</Label>
                                        <div className="font-mono text-sm">{editingGame?.versao_atual}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nova_versao">Nova Versão</Label>
                                        <Input
                                            id="nova_versao"
                                            name="nova_versao"
                                            placeholder="Ex: 1.1"
                                            pattern="[0-9]+\.[0-9]+(\.[0-9]+)?"
                                            disabled={isReadOnly}
                                        />
                                        <p className="text-xs text-muted-foreground">Preencha apenas se for atualizar a versão.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notas_versao">Notas da Atualização (Changelog)</Label>
                                        <Textarea
                                            id="notas_versao"
                                            name="notas_versao"
                                            className="h-32"
                                            placeholder="Descreva o que mudou nesta versão..."
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    {isReadOnly ? 'Fechar' : 'Cancelar'}
                                </Button>
                                {!isReadOnly && (
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Salvando...' : (editingGame ? 'Salvar Alterações' : 'Criar Jogo')}
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Histórico de Versões</DialogTitle>
                        <DialogDescription>
                            {editingGame?.nome}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-8">
                            {isLoading ? (
                                <div className="text-center py-8">Carregando histórico...</div>
                            ) : gameVersions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Nenhum histórico encontrado.</div>
                            ) : (
                                gameVersions.map((version, idx) => (
                                    <div key={version.id} className="relative pl-8 border-l border-gray-200 dark:border-gray-800 last:border-0 pb-8 last:pb-0">
                                        <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-gray-950" />
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-sm">Versão {version.versao}</h4>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(version.criado_em), "dd 'de' MMM, yyyy HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                                            {version.notas_atualizacao || 'Sem notas.'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div >
    )
}
