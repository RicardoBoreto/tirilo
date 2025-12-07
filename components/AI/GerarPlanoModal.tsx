'use client'

import { useState, useEffect } from 'react'
import { getActivePrompts, PromptIA } from '@/lib/actions/ai_prompts'
import { generateInterventionPlan, saveInterventionPlan } from '@/lib/actions/ai_generation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Sparkles, Save, MessageSquare, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Textarea } from '@/components/ui/textarea'

import { useRouter } from 'next/navigation'

interface GerarPlanoModalProps {
    pacienteId: number
    trigger?: React.ReactNode
}

export default function GerarPlanoModal({ pacienteId, trigger }: GerarPlanoModalProps) {
    const [open, setOpen] = useState(false)
    const [prompts, setPrompts] = useState<PromptIA[]>([])
    const [selectedPromptId, setSelectedPromptId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null)
    const [originalPlan, setOriginalPlan] = useState<string | null>(null)
    const [chatMode, setChatMode] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const router = useRouter()

    const [error, setError] = useState<string | null>(null)

    // Load prompts when opening
    useEffect(() => {
        if (open) {
            getActivePrompts().then(data => {
                // Filter: Only 'plano' or generic (null)
                const planPrompts = data.filter(p => !p.categoria || p.categoria === 'plano')
                setPrompts(planPrompts)
                if (planPrompts.length > 0) setSelectedPromptId(planPrompts[0].id.toString())
            })
        }
    }, [open])

    async function handleGenerate() {
        if (!selectedPromptId) return
        setLoading(true)
        setError(null)
        setGeneratedPlan(null)
        setOriginalPlan(null)

        const result = await generateInterventionPlan(Number(selectedPromptId), pacienteId)

        if (result.success && result.plan) {
            setGeneratedPlan(result.plan)
            setOriginalPlan(result.plan)
        } else {
            setError(result.error || 'Erro desconhecido ao gerar plano.')
        }
        setLoading(false)
    }

    async function handleSave() {
        if (!generatedPlan || !selectedPromptId) return

        const result = await saveInterventionPlan(
            pacienteId,
            Number(selectedPromptId),
            originalPlan || '',
            generatedPlan
        )

        if (result.success) {
            alert('Plano salvo com sucesso!')
            setOpen(false)
            router.refresh()
        } else {
            alert('Erro ao salvar: ' + result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Plano com IA
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 gap-0 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            Assistente Inteligente
                        </DialogTitle>
                    </DialogHeader>

                    {!generatedPlan && (
                        <div className="mt-4 flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-gray-600">Escolha o estilo da IA:</label>
                                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                                    <SelectTrigger className="bg-white border-gray-200 rounded-xl h-12">
                                        <SelectValue placeholder="Selecione um prompt..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {prompts.map(prompt => (
                                            <SelectItem key={prompt.id} value={prompt.id.toString()}>
                                                {prompt.nome_prompt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !selectedPromptId}
                                className="h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Plano'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden bg-gray-50/50 flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                            <p className="animate-pulse font-medium">A IA está analisando o prontuário e criando o plano...</p>
                        </div>
                    ) : generatedPlan ? (
                        <div className="flex-1 flex flex-col h-full">
                            <ScrollArea className="flex-1 p-8">
                                <div className="prose prose-purple max-w-none dark:prose-invert">
                                    <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setGeneratedPlan(null)} className="rounded-xl">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Gerar Novamente
                                    </Button>
                                    <Button variant="outline" className="rounded-xl" onClick={() => alert('Chat em breve!')}>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Conversar com a IA
                                    </Button>
                                </div>
                                <Button onClick={handleSave} className="rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md">
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Plano
                                </Button>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-8 text-center gap-4">
                            <div className="bg-red-50 p-4 rounded-full">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Ops! Algo deu errado.</h3>
                                <p className="max-w-md mx-auto">{error}</p>
                            </div>
                            <Button variant="outline" onClick={handleGenerate}>Tentar Novamente</Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
                            <div>
                                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Selecione um prompt acima para gerar um plano de intervenção personalizado.</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
