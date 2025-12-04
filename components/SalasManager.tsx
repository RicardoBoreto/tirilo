'use client'

import { useState } from 'react'
import { createSala, updateSala, deleteSala, type Sala } from '@/lib/actions/salas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Box, Pencil, Trash2, Palette } from 'lucide-react'

export default function SalasManager({ initialSalas }: { initialSalas: Sala[] }) {
    const [salas, setSalas] = useState(initialSalas)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingSala, setEditingSala] = useState<Sala | null>(null)

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        capacidade: 1,
        cor_identificacao: '#3b82f6'
    })

    const resetForm = () => {
        setFormData({
            nome: '',
            descricao: '',
            capacidade: 1,
            cor_identificacao: '#3b82f6'
        })
        setEditingSala(null)
    }

    const handleEdit = (sala: Sala) => {
        setEditingSala(sala)
        setFormData({
            nome: sala.nome,
            descricao: sala.descricao || '',
            capacidade: sala.capacidade,
            cor_identificacao: sala.cor_identificacao
        })
        setOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta sala?')) return
        await deleteSala(id)
        // Optimistic update or refresh handled by parent/server action revalidate
        // For now, let's just refresh page via router or rely on revalidatePath
        window.location.reload()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingSala) {
                await updateSala(editingSala.id, formData)
            } else {
                await createSala(formData)
            }
            setOpen(false)
            resetForm()
            window.location.reload()
        } catch (error) {
            alert('Erro ao salvar sala')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Box className="w-6 h-6 text-primary" />
                        Salas de Atendimento
                    </h2>
                    <p className="text-gray-500">Gerencie os espaços físicos da clínica</p>
                </div>
                <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Sala
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSala ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Nome da Sala</Label>
                                <Input
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Sala 01 - Fonoaudiologia"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição (Opcional)</Label>
                                <Input
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Ex: Sala com espelho e tatame"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Capacidade (Pessoas)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        required
                                        value={formData.capacidade}
                                        onChange={e => setFormData({ ...formData, capacidade: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor de Identificação</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            value={formData.cor_identificacao}
                                            onChange={e => setFormData({ ...formData, cor_identificacao: e.target.value })}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">{formData.cor_identificacao}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingSala ? 'Salvar Alterações' : 'Criar Sala')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialSalas.map(sala => (
                    <div key={sala.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(sala)}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(sala.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                                style={{ backgroundColor: `${sala.cor_identificacao}20`, color: sala.cor_identificacao }}
                            >
                                <Box className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{sala.nome}</h3>
                                <p className="text-xs text-gray-500">Capacidade: {sala.capacidade} pessoas</p>
                            </div>
                        </div>

                        {sala.descricao && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {sala.descricao}
                            </p>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${sala.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {sala.ativa ? 'Ativa' : 'Inativa'}
                            </span>
                        </div>
                    </div>
                ))}

                {initialSalas.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma sala cadastrada</h3>
                        <p className="text-gray-500">Comece adicionando as salas de atendimento da sua clínica.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
