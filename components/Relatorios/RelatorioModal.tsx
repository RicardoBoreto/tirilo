'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles, Save, CheckCircle, MessageSquare, Mic, User, Bot, Send, Edit, FileText, RefreshCw } from 'lucide-react'
import { getActivePrompts, PromptIA } from '@/lib/actions/ai_prompts'
import { generateSessionReport, refineSessionReport } from '@/lib/actions/ai_generation'
import { saveRelatorio, getRelatorioByAgendamento } from '@/lib/actions/relatorios'
import { Agendamento } from '@/lib/actions/agenda'
import ReactMarkdown from 'react-markdown'

interface RelatorioModalProps {
    agendamento: Agendamento
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function RelatorioModal({ agendamento, open, onOpenChange, onSuccess }: RelatorioModalProps) {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [prompts, setPrompts] = useState<PromptIA[]>([])
    const [selectedPromptId, setSelectedPromptId] = useState<string>('')

    const [textoBruto, setTextoBruto] = useState('')
    const [instrucoesAdicionais, setInstrucoesAdicionais] = useState('') // New instruction state
    const [relatorioGerado, setRelatorioGerado] = useState('')
    const [status, setStatus] = useState<'rascunho' | 'finalizado'>('rascunho')

    // UI Modes
    const [isEditingMode, setIsEditingMode] = useState(false)

    // Chat / Refinement State
    const [refining, setRefining] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    // Speech Recognition State
    const [isListening, setIsListening] = useState(false)
    const [recognitionRef, setRecognitionRef] = useState<any>(null)

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chatHistory])

    const toggleDictation = () => {
        if (isListening) {
            if (recognitionRef) recognitionRef.stop()
            setIsListening(false)
            return
        }

        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            if (!SpeechRecognition) {
                alert('Seu navegador não suporta ditado de voz. Tente usar o Google Chrome.')
                return
            }

            const recognition = new SpeechRecognition()
            recognition.lang = 'pt-BR'
            recognition.continuous = false
            recognition.interimResults = false

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)
            recognition.onerror = (e: any) => {
                console.error('Erro detalhes:', e)
                setIsListening(false)
            }

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setTextoBruto(prev => {
                    const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : ''
                    return prev + spacer + transcript
                })
            }

            recognition.start()
            setRecognitionRef(recognition)
        }
    }

    useEffect(() => {
        if (open) {
            // Reset states
            setRelatorioGerado('')
            setChatHistory([])
            setInstrucoesAdicionais('')
            setIsEditingMode(false)

            // Fetch prompts
            getActivePrompts().then(data => {
                const reportPrompts = data.filter(p => p.categoria === 'relatorio')
                setPrompts(reportPrompts)
                if (reportPrompts.length > 0) setSelectedPromptId(reportPrompts[0].id.toString())
            })

            // Fetch existing report
            getRelatorioByAgendamento(agendamento.id).then(data => {
                if (data) {
                    setTextoBruto(data.texto_bruto || '')
                    setRelatorioGerado(data.relatorio_gerado || '')
                    if (data.id_prompt_ia) setSelectedPromptId(data.id_prompt_ia.toString())
                    setStatus(data.status as any)
                }
            })
        }
    }, [open, agendamento.id])

    async function handleGenerate() {
        if (!textoBruto) return alert('Digite as anotações da sessão primeiro.')
        if (!selectedPromptId) return alert('Selecione um prompt.')

        setGenerating(true)
        setRelatorioGerado('')
        setChatHistory([])

        try {
            const result = await generateSessionReport(
                Number(selectedPromptId),
                agendamento.id_paciente,
                textoBruto,
                agendamento.data_hora_inicio,
                instrucoesAdicionais
            )

            if (result.success && result.report) {
                setRelatorioGerado(result.report)
            } else {
                alert(result.error || 'Erro ao gerar relatório')
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao gerar relatório')
        } finally {
            setGenerating(false)
        }
    }

    async function handleRefine() {
        if (!chatInput.trim() || !relatorioGerado) return

        const userMessage = chatInput
        setChatInput('')
        setRefining(true)

        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }])

        try {
            const result = await refineSessionReport(relatorioGerado, userMessage, agendamento.id_paciente)

            if (result.success && result.report) {
                setRelatorioGerado(result.report)
                setChatHistory(prev => [...prev, { role: 'assistant', text: 'Relatório atualizado com sucesso!' }])
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

    async function handleSave(newStatus: 'rascunho' | 'finalizado') {
        setLoading(true)
        try {
            const result = await saveRelatorio({
                id_agendamento: agendamento.id,
                id_paciente: agendamento.id_paciente,
                texto_bruto: textoBruto,
                relatorio_gerado: relatorioGerado,
                id_prompt_ia: selectedPromptId ? Number(selectedPromptId) : null,
                status: newStatus
            })

            if (result.success) {
                if (newStatus === 'finalizado') {
                    onOpenChange(false)
                    if (onSuccess) onSuccess()
                } else {
                    alert('Rascunho salvo com sucesso!')
                }
            } else {
                alert('Erro ao salvar: ' + result.error) // result.error check might be redundant if typescript doesn't complain but safer
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        Relatório de Atendimento com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50/50 dark:bg-gray-900/50">

                    {/* Left Column (Input) - Turns into Sidebar when Generated */}
                    <div className={`p-6 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col gap-4 overflow-y-auto ${relatorioGerado ? 'w-full md:w-1/3' : 'w-full'}`}>

                        <div className="space-y-2">
                            <Label>Prompt da IA</Label>
                            <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                    <SelectValue placeholder="Selecione o estilo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {prompts.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nome_prompt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Anotações da Sessão</Label>
                                <Button
                                    type="button"
                                    onClick={toggleDictation}
                                    variant={isListening ? "destructive" : "outline"}
                                    size="sm"
                                    className={`h-7 text-xs ${isListening ? 'animate-pulse' : ''}`}
                                >
                                    <Mic className="w-3 h-3 mr-1" />
                                    {isListening ? 'Ouvindo...' : 'Ditar'}
                                </Button>
                            </div>
                            <Textarea
                                value={textoBruto}
                                onChange={e => setTextoBruto(e.target.value)}
                                placeholder="Descreva os acontecimentos, comportamentos e intervenções..."
                                className="min-h-[150px] resize-none focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Instruções Adicionais (Opcional)</Label>
                            <Textarea
                                value={instrucoesAdicionais}
                                onChange={e => setInstrucoesAdicionais(e.target.value)}
                                placeholder="Ex: Foque na regulação emocional; Seja conciso..."
                                className="h-20 resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={generating || !textoBruto}
                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-12 shadow-md"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    {relatorioGerado ? 'Regerar Relatório' : 'Gerar Relatório'}
                                </>
                            )}
                        </Button>

                        {/* Status Indicator if loaded */}
                        {status === 'finalizado' && (
                            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center font-medium">
                                <CheckCircle className="w-4 h-4 inline mr-2" />
                                Relatório Finalizado
                            </div>
                        )}
                    </div>

                    {/* Right Column (Preview & Chat) */}
                    {relatorioGerado && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Preview Area */}
                            <div className="flex-1 overflow-hidden relative border-b border-gray-200 dark:border-gray-800">
                                <ScrollArea className="h-full p-8">
                                    {isEditingMode ? (
                                        <Textarea
                                            value={relatorioGerado}
                                            onChange={(e) => setRelatorioGerado(e.target.value)}
                                            className="min-h-[500px] font-mono text-sm leading-relaxed p-4 border-none shadow-none focus-visible:ring-0"
                                        />
                                    ) : (
                                        <div className="prose prose-emerald max-w-none dark:prose-invert">
                                            <ReactMarkdown>{relatorioGerado}</ReactMarkdown>
                                        </div>
                                    )}
                                </ScrollArea>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={isEditingMode ? "secondary" : "outline"}
                                        onClick={() => setIsEditingMode(!isEditingMode)}
                                        className="bg-white/80 backdrop-blur"
                                    >
                                        {isEditingMode ? <FileText className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                        {isEditingMode ? 'Ver Preview' : 'Editar Texto'}
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Interface */}
                            <div className="h-[250px] bg-gray-50 border-t border-gray-100 flex flex-col">
                                <div className="px-4 py-2 border-b border-gray-100 bg-white">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-emerald-600" />
                                        Refinar com IA
                                    </h3>
                                </div>
                                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                                    <div className="space-y-4">
                                        {chatHistory.length === 0 && (
                                            <p className="text-xs text-gray-400 text-center italic">
                                                Envie comandos para ajustar o relatório. Ex: "Resuma o primeiro parágrafo".
                                            </p>
                                        )}
                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                </div>
                                                <div className={`text-xs p-2 rounded-xl max-w-[85%] break-words whitespace-pre-wrap ${msg.role === 'user'
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {refining && (
                                            <div className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                </div>
                                                <div className="bg-white border border-gray-200 text-gray-500 text-xs p-2 rounded-xl rounded-tl-none shadow-sm italic">
                                                    Refinando...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !refining && handleRefine()}
                                        placeholder="Digite seu ajuste..."
                                        className="h-9 text-sm"
                                        disabled={refining}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"
                                        onClick={handleRefine}
                                        disabled={refining || !chatInput.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white dark:bg-gray-800 gap-2 flex-shrink-0">
                    <Button variant="outline" onClick={() => handleSave('rascunho')} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Rascunho
                    </Button>
                    <Button onClick={() => handleSave('finalizado')} disabled={loading || !relatorioGerado} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar e Finalizar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
