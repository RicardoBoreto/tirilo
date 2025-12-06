'use client'

import { useState } from 'react'
import { createSala, updateSala, Sala } from '@/lib/actions/salas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Box, Music, Gamepad2, Puzzle, BookOpen, Smile, Star, Heart, Sun, Cloud, Moon, Flower, Zap, Anchor, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = [
    { value: 'box', label: 'Caixa', icon: Box },
    { value: 'music', label: 'Música', icon: Music },
    { value: 'gamepad', label: 'Jogos', icon: Gamepad2 },
    { value: 'puzzle', label: 'Quebra-cabeça', icon: Puzzle },
    { value: 'book', label: 'Leitura', icon: BookOpen },
    { value: 'smile', label: 'Sorriso', icon: Smile },
    { value: 'star', label: 'Estrela', icon: Star },
    { value: 'heart', label: 'Coração', icon: Heart },
    { value: 'sun', label: 'Sol', icon: Sun },
    { value: 'cloud', label: 'Nuvem', icon: Cloud },
    { value: 'moon', label: 'Lua', icon: Moon },
    { value: 'flower', label: 'Flor', icon: Flower },
    { value: 'zap', label: 'Energia', icon: Zap },
    { value: 'anchor', label: 'Âncora', icon: Anchor },
    { value: 'coffee', label: 'Pausa', icon: Coffee },
]

const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
]

interface SalaFormProps {
    sala?: Sala
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function SalaForm({ sala, trigger, open, onOpenChange }: SalaFormProps) {
    const [loading, setLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)

    // Controlled state for form fields
    const [nome, setNome] = useState(sala?.nome || '')
    const [cor, setCor] = useState(sala?.cor_identificacao || COLORS[0])
    // Icon not in DB type, defaulting to box for UI only
    const [icone, setIcone] = useState('box')
    const [capacidade, setCapacidade] = useState(sala?.capacidade?.toString() || '1')
    const [observacoes, setObservacoes] = useState(sala?.descricao || '')
    const [ativo, setAtivo] = useState(sala?.ativa ?? true)

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const payload = {
            nome,
            cor_identificacao: cor,
            capacidade: parseInt(capacidade),
            descricao: observacoes,
            ativa: ativo
        }

        try {
            if (sala) {
                await updateSala(sala.id, payload)
            } else {
                // @ts-ignore - createSala expects Omit<Sala, ...> but we are passing a compatible object
                await createSala(payload)
            }
            setIsOpen(false)
            // Reset form if creating
            if (!sala) {
                setNome('')
                setCor(COLORS[0])
                setIcone('box')
                setCapacidade('1')
                setObservacoes('')
                setAtivo(true)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar sala')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sala ? 'Editar Sala' : 'Nova Sala/Recurso'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Sala *</Label>
                        <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            placeholder="Ex: Sala Arco-Íris"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cor Identificadora</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCor(c)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all border-2",
                                            cor === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ícone</Label>
                            <Select value={icone} onValueChange={setIcone}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ICONS.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            <div className="flex items-center gap-2">
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacidade">Capacidade (crianças)</Label>
                        <Input
                            id="capacidade"
                            type="number"
                            min="1"
                            value={capacidade}
                            onChange={(e) => setCapacidade(e.target.value)}
                            required
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Detalhes sobre a sala..."
                            className="rounded-xl resize-none h-24"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <Label htmlFor="ativo" className="cursor-pointer">Situação: {ativo ? 'Ativo' : 'Inativo'}</Label>
                        <div
                            onClick={() => setAtivo(!ativo)}
                            className={cn(
                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                                ativo ? "bg-green-500" : "bg-gray-300"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 bg-white rounded-full transition-transform",
                                ativo ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-lg font-medium"
                        style={{ backgroundColor: cor }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Sala'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
