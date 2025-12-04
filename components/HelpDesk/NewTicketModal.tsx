'use client'

import { useState } from 'react'
import { createTicket } from '@/lib/actions/help-desk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, LifeBuoy } from 'lucide-react'

export default function NewTicketModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        assunto: '',
        tipo: 'problema',
        prioridade: 'media',
        mensagem_inicial: ''
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createTicket(formData)
            if (result.error) {
                alert(result.error)
            } else {
                setOpen(false)
                setFormData({
                    assunto: '',
                    tipo: 'problema',
                    prioridade: 'media',
                    mensagem_inicial: ''
                })
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao criar ticket')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Chamado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <LifeBuoy className="w-6 h-6 text-primary" />
                        Abrir Novo Chamado
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Input
                            required
                            value={formData.assunto}
                            onChange={e => setFormData({ ...formData, assunto: e.target.value })}
                            placeholder="Resumo do problema ou sugestão..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option value="problema">Relatar Problema</option>
                                <option value="sugestao">Sugestão de Melhoria</option>
                                <option value="duvida">Dúvida de Uso</option>
                                <option value="financeiro">Financeiro</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={formData.prioridade}
                                onChange={e => setFormData({ ...formData, prioridade: e.target.value })}
                            >
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição Detalhada</Label>
                        <Textarea
                            required
                            className="min-h-[150px]"
                            value={formData.mensagem_inicial}
                            onChange={e => setFormData({ ...formData, mensagem_inicial: e.target.value })}
                            placeholder="Descreva o que aconteceu, passos para reproduzir, ou sua ideia..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Abrir Chamado'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
