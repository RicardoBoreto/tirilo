'use client'

import { useState, useEffect, useRef } from 'react'
import { getActivePrompts, PromptIA } from '@/lib/actions/ai_prompts'
import { generateInterventionPlan, saveInterventionPlan, refineGeneratedPlan } from '@/lib/actions/ai_generation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Sparkles, Save, MessageSquare, RefreshCw, FileText, Edit, Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

interface GerarPlanoModalProps {
    pacienteId: number
    trigger?: React.ReactNode
}

export default function GerarPlanoModal({ pacienteId, trigger }: GerarPlanoModalProps) {
    const [open, setOpen] = useState(false)
    const [prompts, setPrompts] = useState<PromptIA[]>([])
    const [selectedPromptId, setSelectedPromptId] = useState<string>('')
    const [instrucoesAdicionais, setInstrucoesAdicionais] = useState('') // New state

    const [loading, setLoading] = useState(false)
    const [refining, setRefining] = useState(false) // New state

    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null)
    const [originalPlan, setOriginalPlan] = useState<string | null>(null)
    const [isEditingMode, setIsEditingMode] = useState(false)

    // Chat states
    const [chatInput, setChatInput] = useState('')
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    const router = useRouter()

    const [error, setError] = useState<string | null>(null)

    // Scroll chat to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chatHistory])

    // Load prompts when opening
    useEffect(() => {
        if (open) {
            setGeneratedPlan(null)
            setChatHistory([])
            setInstrucoesAdicionais('')
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
        setChatHistory([]) // Reset chat

        const result = await generateInterventionPlan(Number(selectedPromptId), pacienteId, instrucoesAdicionais)

        if (result.success && result.plan) {
            setGeneratedPlan(result.plan)
            setOriginalPlan(result.plan)
        } else {
            setError(result.error || 'Erro desconhecido ao gerar plano.')
        }
        setLoading(false)
    }

    async function handleRefine() {
        if (!chatInput.trim() || !generatedPlan) return

        const userMessage = chatInput
        setChatInput('')
        setRefining(true)

        // Add user message to history
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }])

        try {
            const result = await refineGeneratedPlan(generatedPlan, userMessage, pacienteId)

            if (result.success && result.plan) {
                setGeneratedPlan(result.plan)
                // Add AI response to history
                setChatHistory(prev => [...prev, { role: 'assistant', text: 'Plano atualizado com sucesso!' }])
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', text: 'Erro ao atualizar: ' + result.error }])
            }
        } catch (e) {
            console.error(e)
            setChatHistory(prev => [...prev, { role: 'assistant', text: 'Erro de conexão.' }])
        } finally {
            setRefining(false)
        }
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
                    <Button className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full sm:w-auto">
                        <Sparkles className="w-6 h-6 mr-2 fill-current" />
                        Gerar Plano (IA)
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
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Instruções Adicionais (Opcional):</label>
                                <Textarea
                                    placeholder="Ex: Foque em atividades ao ar livre; Use jogos de tabuleiro; Evite atividades com barulho alto..."
                                    value={instrucoesAdicionais}
                                    onChange={(e) => setInstrucoesAdicionais(e.target.value)}
                                    className="bg-white/50 border-gray-200 min-h-[80px]"
                                />
                            </div>

                            <div className="flex gap-3 items-end">
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

                        <div className="flex-1 flex gap-0 h-full overflow-hidden">
                            {/* Left Side: Plan Preview */}
                            <div className="flex-1 flex flex-col h-full border-r border-gray-100">
                                <ScrollArea className="flex-1 p-8">
                                    {isEditingMode ? (
                                        <Textarea
                                            value={generatedPlan}
                                            onChange={(e) => setGeneratedPlan(e.target.value)}
                                            className="h-full min-h-[500px] font-mono text-sm leading-relaxed p-4"
                                        />
                                    ) : (
                                        <div className="prose prose-purple max-w-none dark:prose-invert">
                                            <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-4">
                                    <Button
                                        variant={isEditingMode ? "secondary" : "outline"}
                                        className="rounded-xl"
                                        onClick={() => setIsEditingMode(!isEditingMode)}
                                    >
                                        {isEditingMode ? <FileText className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                        {isEditingMode ? 'Ver Preview' : 'Editar Texto'}
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setGeneratedPlan(null)} className="rounded-xl">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reiniciar
                                        </Button>
                                        <Button onClick={handleSave} className="rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md">
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Chat Assistant */}
                            <div className="w-[350px] flex flex-col bg-gray-50 h-full">
                                <div className="p-4 border-b border-gray-100 bg-white">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-purple-600" />
                                        Refinar com IA
                                    </h3>
                                </div>

                                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                                    <div className="space-y-4">
                                        {chatHistory.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center italic mt-10">
                                                Envie comandos para ajustar o plano. <br />Ex: "Deixe o tom mais formal" ou "Adicione uma pausa".
                                            </p>
                                        )}

                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                                    }`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                </div>
                                                <div className={`text-sm p-3 rounded-2xl max-w-[85%] break-words whitespace-pre-wrap ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}

                                        {refining && (
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </div>
                                                <div className="bg-white border border-gray-200 text-gray-500 text-sm p-3 rounded-2xl rounded-tl-none shadow-sm italic">
                                                    Refinando o plano...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                <div className="p-3 bg-white border-t border-gray-100">
                                    <div className="relative">
                                        <Input
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !refining && handleRefine()}
                                            placeholder="Digite seu ajuste..."
                                            className="pr-10 rounded-xl"
                                            disabled={refining}
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-1 top-1 h-8 w-8 text-purple-600 hover:bg-purple-50"
                                            onClick={handleRefine}
                                            disabled={refining || !chatInput.trim()}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
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
