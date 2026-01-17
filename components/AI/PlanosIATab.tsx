'use client'

import ReactMarkdown from 'react-markdown'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Play, Pause, FileText, CheckCircle, Clock, Settings2, Upload, Loader2, Sparkles, Trash2, Printer, FileDown } from 'lucide-react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'

import { extractPlanoFromImage, importarPlanoLegado, deletePlanoIA } from '@/lib/actions/planos'
import { refineInterventionPlan } from '@/lib/actions/ai_generation'
import { Send, MessageSquare } from 'lucide-react'

// Helper to strip markdown for TTS and PDF
function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6} /g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/>/g, '')
        .replace(/- /g, '')
}

type PlanoIA = {
    id: number
    created_at: string
    titulo: string
    plano_final: string
    modelo_ia: string
    terapeuta?: {
        nome_completo: string
    }
    historico_chat?: any[]
}

type Props = {
    planos: PlanoIA[]
    pacienteId: number
}

export default function PlanosIATab({ planos, pacienteId }: Props) {
    const router = useRouter()
    const [selectedPlano, setSelectedPlano] = useState<PlanoIA | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speechSynthesisInstance, setSpeechSynthesisInstance] = useState<SpeechSynthesisUtterance | null>(null)
    const [isDeleting, setIsDeleting] = useState<number | null>(null)

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [importingStep, setImportingStep] = useState<'upload' | 'review'>('upload')
    const [processingAI, setProcessingAI] = useState(false)
    const [savingImport, setSavingImport] = useState(false)
    const [importData, setImportData] = useState({
        titulo: '',
        dataCriacao: '',
        texto: ''
    })

    // TTS State
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<string>('')
    const [rate, setRate] = useState([1.0])

    // Chat & Refinement States
    const [chatMode, setChatMode] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [isRefining, setIsRefining] = useState(false)

    const handleRefine = async () => {
        if (!selectedPlano || !chatInput.trim()) return

        setIsRefining(true)
        try {
            // Optimistic Update (UI Only) - Adiciona msg do usuário
            const currentHistory = selectedPlano.historico_chat || []
            // Não vamos atualizar o estado optimisticamente complexo, vamos esperar a IA.

            const result = await refineInterventionPlan(selectedPlano.id, chatInput)

            if (result.success) {
                setSelectedPlano({
                    ...selectedPlano,
                    plano_final: result.plano,
                    historico_chat: result.historico
                })
                setChatInput('')
                // Alerta sucesso?
            } else {
                alert('Erro ao refinar: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao comunicar com a IA')
        } finally {
            setIsRefining(false)
        }
    }

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            const ptVoices = availableVoices.filter(v => v.lang.includes('pt'))
            setVoices(ptVoices.length > 0 ? ptVoices : availableVoices)
            if (ptVoices.length > 0 && !selectedVoice) setSelectedVoice(ptVoices[0].name)
        }
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
        return () => { window.speechSynthesis.onvoiceschanged = null }
    }, [])

    const handlePlayPause = (text: string) => {
        if (!window.speechSynthesis) {
            alert('Seu navegador não suporta leitura de texto (TTS).')
            return
        }
        if (isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            setSpeechSynthesisInstance(null)
        } else {
            const cleanText = stripMarkdown(text)
            const utterance = new SpeechSynthesisUtterance(cleanText)
            utterance.lang = 'pt-BR'
            utterance.rate = rate[0]
            if (selectedVoice) {
                const voice = voices.find(v => v.name === selectedVoice)
                if (voice) utterance.voice = voice
            }
            utterance.onend = () => {
                setIsPlaying(false)
                setSpeechSynthesisInstance(null)
            }
            window.speechSynthesis.speak(utterance)
            setSpeechSynthesisInstance(utterance)
            setIsPlaying(true)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedPlano(null)
            setChatMode(false)
            if (isPlaying) {
                window.speechSynthesis.cancel()
                setIsPlaying(false)
                setSpeechSynthesisInstance(null)
            }
        } else {
            // open logic handled by trigger
        }
    }

    // --- PDF Generator ---
    const handleGeneratePDF = () => {
        if (!selectedPlano) return
        const doc = new jsPDF()
        const date = new Date(selectedPlano.created_at)

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let yPosition = margin

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(stripMarkdown(selectedPlano.titulo || 'Plano de Intervenção'), margin, yPosition)
        yPosition += 10

        doc.setLineWidth(0.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Gerado em: ${format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition)
        yPosition += 6
        doc.text(`Terapeuta: ${selectedPlano.terapeuta?.nome_completo || 'Sistema'}`, margin, yPosition)
        yPosition += 10
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        doc.setFontSize(11)
        const cleanContent = stripMarkdown(selectedPlano.plano_final)
        const paragraphs = cleanContent.split('\n')

        paragraphs.forEach((p) => {
            const cleanP = p.trim()
            if (!cleanP) {
                yPosition += 6
                return
            }
            // Justified logic
            const lines = doc.splitTextToSize(cleanP, maxWidth)
            const lineHeight = 6
            const blockHeight = lines.length * lineHeight
            const maxPageHeight = pageHeight - (margin * 2)

            if (blockHeight > maxPageHeight) {
                lines.forEach((line: string) => {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage()
                        yPosition = margin
                    }
                    doc.text(line, margin, yPosition)
                    yPosition += lineHeight
                })
            } else {
                if (yPosition + blockHeight > pageHeight - margin) {
                    doc.addPage()
                    yPosition = margin
                }
                doc.text(cleanP, margin, yPosition, { maxWidth: maxWidth, align: 'justify' })
                yPosition += blockHeight
            }
            yPosition += 2
        })

        const fileName = `Plano_${selectedPlano.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        doc.save(fileName)
    }

    // --- Delete Handler ---
    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation() // Prevent dialog open
        if (!confirm('Tem certeza que deseja excluir este plano?')) return
        if (!pacienteId) return

        setIsDeleting(id)
        try {
            await deletePlanoIA(id, pacienteId)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir plano')
        } finally {
            setIsDeleting(null)
        }
    }

    // --- Import Handlers ---
    const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setProcessingAI(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const extracted = await extractPlanoFromImage(formData)
            setImportData({
                titulo: extracted.titulo || 'Plano Importado (IA)',
                dataCriacao: extracted.data_criacao || new Date().toISOString().split('T')[0],
                texto: extracted.conteudo || ''
            })
            setImportingStep('review')
        } catch (error) {
            console.error(error)
            alert('Erro ao extrair dados.')
        } finally {
            setProcessingAI(false)
            e.target.value = ''
        }
    }

    const handleConfirmImport = async () => {
        if (!pacienteId) return
        setSavingImport(true)
        try {
            await importarPlanoLegado({
                pacienteId: pacienteId,
                titulo: importData.titulo,
                dataCriacao: importData.dataCriacao,
                texto: importData.texto
            })
            setIsImportModalOpen(false)
            setImportingStep('upload')
            setImportData({ titulo: '', dataCriacao: '', texto: '' })
            router.refresh()
            alert('Plano importado com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar plano')
        } finally {
            setSavingImport(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Planos de Intervenção Gerados
                </h3>
                {pacienteId && (
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 gap-2"
                        variant="secondary"
                    >
                        <Sparkles className="w-4 h-4" />
                        Importar Plano (IA)
                    </Button>
                )}
            </div>

            {(!planos || planos.length === 0) ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum plano gerado</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                        Gere um novo plano de intervenção usando a IA ou importe um arquivo.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {planos.map((plano) => (
                        <div
                            key={plano.id}
                            onClick={() => { setSelectedPlano(plano); setChatMode(false); }}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-all cursor-pointer shadow-sm hover:shadow-md group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {plano.titulo}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {plano.modelo_ia}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-red-500 -mt-1 -mr-2"
                                        onClick={(e) => handleDelete(e, plano.id)}
                                        disabled={isDeleting === plano.id}
                                    >
                                        {isDeleting === plano.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(plano.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </span>
                                {plano.terapeuta && (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        {plano.terapeuta.nome_completo}
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {stripMarkdown(plano.plano_final)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Single Dialog Instance for View/Edit */}
            <Dialog open={!!selectedPlano} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between mr-8">
                            <span>{selectedPlano?.titulo}</span>
                        </DialogTitle>
                        <div className="text-sm text-gray-500 flex gap-4 mt-1">
                            <span>Gerado em {selectedPlano && format(new Date(selectedPlano.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                        <div className="flex justify-between items-center gap-4 border-b pb-4">
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Settings2 className="w-4 h-4" />
                                            Voz
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Voz e Velocidade</h4>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="voice">Voz</Label>
                                                <Select onValueChange={setSelectedVoice} value={selectedVoice}>
                                                    <SelectTrigger id="voice" className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        {voices.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="rate">Velocidade: {rate[0]}x</Label>
                                                <Slider id="rate" max={2} min={0.5} step={0.1} value={rate} onValueChange={setRate} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    onClick={() => selectedPlano && handlePlayPause(selectedPlano.plano_final)}
                                    variant={isPlaying ? "destructive" : "default"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    {isPlaying ? <><Pause className="w-4 h-4" /> Parar</> : <><Play className="w-4 h-4" /> Ler</>}
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={chatMode ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setChatMode(!chatMode)}
                                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {chatMode ? 'Ver Documento' : 'Refinar com IA'}
                                </Button>

                                <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="gap-2">
                                    <FileDown className="w-4 h-4" /> PDF
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative border rounded-md bg-gray-50 dark:bg-gray-900 flex">
                            {!chatMode ? (
                                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                    <div className="prose dark:prose-invert max-w-none text-justify">
                                        <ReactMarkdown>{selectedPlano?.plano_final || ''}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                        {(!selectedPlano?.historico_chat || selectedPlano.historico_chat.length === 0) && (
                                            <div className="text-center text-gray-500 py-8">
                                                <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                                                <p>Este plano foi gerado pela IA.</p>
                                                <p className="text-sm">Envie instruções abaixo para refinar ou alterar o conteúdo.</p>
                                            </div>
                                        )}

                                        {selectedPlano?.historico_chat?.map((msg: any, idx: number) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl p-3 px-4 shadow-sm ${msg.role === 'user'
                                                        ? 'bg-purple-600 text-white rounded-tr-none'
                                                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-600'
                                                    }`}>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {isRefining && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-gray-800 border rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                                                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                                    <span className="text-sm text-gray-500">Reescrevendo plano...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t bg-white dark:bg-gray-800 flex gap-2">
                                        <Textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="O que você gostaria de mudar neste plano?"
                                            className="min-h-[50px] max-h-[120px] resize-none focus-visible:ring-purple-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleRefine()
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleRefine}
                                            disabled={isRefining || !chatInput.trim()}
                                            className="h-full px-6 bg-purple-600 hover:bg-purple-700"
                                        >
                                            {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Importar Plano Histórico</DialogTitle>
                    </DialogHeader>
                    {importingStep === 'upload' ? (
                        <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-center space-y-4">
                                <div className="bg-purple-100 p-4 rounded-full inline-block">
                                    <Upload className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="font-medium text-lg">Faça upload da foto ou PDF</h3>
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                                    {processingAI ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Selecionar Arquivo'}
                                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleAIUpload} disabled={processingAI} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 mb-4">Revise os dados antes de salvar.</div>
                            <div className="space-y-2">
                                <Label>Título do Plano</Label>
                                <Input value={importData.titulo} onChange={(e) => setImportData({ ...importData, titulo: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Criação</Label>
                                <Input type="date" value={importData.dataCriacao} onChange={(e) => setImportData({ ...importData, dataCriacao: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Conteúdo Completo</Label>
                                <Textarea value={importData.texto} onChange={(e) => setImportData({ ...importData, texto: e.target.value })} className="min-h-[200px]" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {importingStep === 'review' && (
                            <>
                                <Button variant="outline" onClick={() => setImportingStep('upload')}>Voltar</Button>
                                <Button onClick={handleConfirmImport} disabled={savingImport}>
                                    {savingImport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Importação'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
