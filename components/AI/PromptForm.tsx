'use client'

import { useState } from 'react'
import { createPrompt, updatePrompt, PromptIA } from '@/lib/actions/ai_prompts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Sparkles } from 'lucide-react'

interface PromptFormProps {
    trigger?: React.ReactNode
    promptToEdit?: PromptIA
    onSuccess?: () => void
    terapeutas?: any[]
    isAdmin?: boolean
}

export default function PromptForm({ trigger, promptToEdit, onSuccess, terapeutas = [], isAdmin = false }: PromptFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            let result
            if (promptToEdit) {
                result = await updatePrompt(promptToEdit.id, formData)
            } else {
                result = await createPrompt(formData)
            }

            if (result.success) {
                setOpen(false)
                if (onSuccess) onSuccess()
            } else {
                alert('Erro: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Criar Novo Prompt
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {promptToEdit ? 'Editar Prompt IA' : 'Novo Prompt IA'}
                    </DialogTitle>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-6 mt-4">
                    {isAdmin && (
                        <div className="space-y-2">
                            <Label>Terapeuta Dono</Label>
                            <Select name="terapeuta_id" defaultValue={promptToEdit?.terapeuta_id || ''}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecione um terapeuta (ou deixe vazio para você)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terapeutas.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.nome_completo || t.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Prompt</Label>
                            <Input
                                name="nome_prompt"
                                defaultValue={promptToEdit?.nome_prompt}
                                placeholder="Ex: Dra. Clara - Plano 50min"
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Modelo Gemini</Label>
                            <Select name="modelo_gemini" defaultValue={promptToEdit?.modelo_gemini || 'gemini-2.5-flash'}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Novo)</SelectItem>
                                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Legado)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição Curta</Label>
                        <Input
                            name="descricao"
                            defaultValue={promptToEdit?.descricao || ''}
                            placeholder="Ex: Focado em crianças com TEA leve"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex justify-between">
                            <span>Texto do Prompt (System Prompt)</span>
                            <span className="text-xs text-gray-500">Use as variáveis: {'{{NOME}}'}, {'{{IDADE}}'}, etc.</span>
                        </Label>
                        <Textarea
                            name="prompt_texto"
                            defaultValue={promptToEdit?.prompt_texto}
                            placeholder="Você é um especialista..."
                            required
                            className="min-h-[300px] font-mono text-sm rounded-xl resize-y"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <div className="space-y-0.5">
                            <Label>Temperatura (Criatividade)</Label>
                            <p className="text-xs text-gray-500">0.0 (Preciso) a 1.0 (Criativo)</p>
                        </div>
                        <div className="w-32">
                            <Input
                                type="number"
                                name="temperatura"
                                step="0.1"
                                min="0"
                                max="1"
                                defaultValue={promptToEdit?.temperatura || 0.7}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    {promptToEdit && (
                        <div className="flex items-center gap-2">
                            <Switch name="ativo" defaultChecked={promptToEdit.ativo} value="true" />
                            <Label>Prompt Ativo</Label>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar Prompt
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
