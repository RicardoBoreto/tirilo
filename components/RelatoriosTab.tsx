'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Eye, User, Calendar, Printer, FileDown, Upload, Loader2, Sparkles, Trash2, Play, Pause, Settings2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { extractRelatorioFromImage, importarRelatorioLegado, deleteRelatorio } from '@/lib/actions/relatorios'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'

// Helper para dividir texto em chunks seguros para Mobile TTS
function splitText(text: string, maxLength: number = 250): string[] {
    // 1. Limpa markdown
    const clean = stripMarkdown(text)

    // 2. Divide em sentenças
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]

    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
        // Se a sentença sozinha já for gigante (raro), quebra ela por palavras
        if (sentence.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim())
                currentChunk = ''
            }
            const words = sentence.split(' ')
            for (const word of words) {
                if ((currentChunk + ' ' + word).length <= maxLength) {
                    currentChunk += (currentChunk ? ' ' : '') + word
                } else {
                    chunks.push(currentChunk.trim())
                    currentChunk = word
                }
            }
            continue
        }

        // Acumula sentenças até o limite
        if ((currentChunk + ' ' + sentence).length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + sentence
        } else {
            chunks.push(currentChunk.trim())
            currentChunk = sentence
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim())

    return chunks
}

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

interface Relatorio {
    id: number
    created_at: string
    relatorio_gerado: string
    status: string
    terapeuta?: {
        nome_completo: string
    }
    agendamento?: {
        data_hora_inicio: string
    }
}

interface RelatoriosTabProps {
    relatorios?: Relatorio[]
    pacienteNome?: string
    pacienteId?: number
}

export default function RelatoriosTab({ relatorios = [], pacienteNome, pacienteId }: RelatoriosTabProps) {
    const router = useRouter()
    const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null)
    const [isDeleting, setIsDeleting] = useState<number | null>(null)

    // TTS States
    const [isPlaying, setIsPlaying] = useState(false)
    const [speechSynthesisInstance, setSpeechSynthesisInstance] = useState<SpeechSynthesisUtterance | null>(null) // Mantido para compatibilidade, mas agora usamos chunks
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<string>('')
    const [rate, setRate] = useState([1.0])

    // Refs para controle de playback sequencial (Chunking)
    const chunksRef = useRef<string[]>([])
    const currentChunkIndexRef = useRef(0)
    const isPlayingRef = useRef(false) // Ref para acesso síncrono nos callbacks

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [importingStep, setImportingStep] = useState<'upload' | 'review'>('upload')
    const [processingAI, setProcessingAI] = useState(false)
    const [savingImport, setSavingImport] = useState(false)
    const [importData, setImportData] = useState({ dataSessao: '', texto: '' })

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

    // Função recursiva para tocar chunks
    const speakNextChunk = () => {
        if (!isPlayingRef.current) return

        if (currentChunkIndexRef.current >= chunksRef.current.length) {
            setIsPlaying(false)
            isPlayingRef.current = false
            currentChunkIndexRef.current = 0
            return
        }

        const chunkText = chunksRef.current[currentChunkIndexRef.current]
        const utterance = new SpeechSynthesisUtterance(chunkText)

        // Configuração de Voz (Mesma lógica robusta)
        utterance.lang = 'pt-BR'
        utterance.rate = rate[0]

        // Tentar recarregar vozes se necessário
        let currentVoices = voices
        if (currentVoices.length === 0) {
            currentVoices = window.speechSynthesis.getVoices()
        }

        if (selectedVoice) {
            const voice = currentVoices.find(v => v.name === selectedVoice)
            if (voice) utterance.voice = voice
        } else if (currentVoices.length > 0) {
            const ptVoice = currentVoices.find(v => v.lang.includes('pt-BR')) || currentVoices.find(v => v.lang.includes('pt'))
            if (ptVoice) utterance.voice = ptVoice
        }

        utterance.onend = () => {
            if (isPlayingRef.current) {
                currentChunkIndexRef.current++
                speakNextChunk()
            }
        }

        utterance.onerror = (e) => {
            console.error('TTS Chunk Error:', e)
            // Tenta pular para o próximo chunk se der erro em um
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                if (isPlayingRef.current) {
                    currentChunkIndexRef.current++
                    setTimeout(speakNextChunk, 100) // Pequeno delay para recuperar engine
                }
            } else {
                setIsPlaying(false)
                isPlayingRef.current = false
            }
        }

        window.speechSynthesis.speak(utterance)
        // Atualiza instância global apenas para referência (cancelamento geral)
        setSpeechSynthesisInstance(utterance)
    }

    const handlePlayPause = (text: string) => {
        if (!window.speechSynthesis) {
            alert('Seu navegador não suporta leitura de texto (TTS).')
            return
        }

        if (isPlaying) {
            // Parar
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            isPlayingRef.current = false
            currentChunkIndexRef.current = 0
            setSpeechSynthesisInstance(null)
        } else {
            // Tocar
            window.speechSynthesis.cancel() // Limpa fila

            // Prepara chunks
            chunksRef.current = splitText(text)
            currentChunkIndexRef.current = 0
            isPlayingRef.current = true
            setIsPlaying(true)

            // Inicia playback
            speakNextChunk()
        }
    }

    const getRelatorioDate = (relatorio: Relatorio) => {
        if (relatorio.agendamento?.data_hora_inicio) {
            return new Date(relatorio.agendamento.data_hora_inicio)
        }
        return new Date(relatorio.created_at)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) return
        if (!pacienteId) return

        setIsDeleting(id)
        try {
            await deleteRelatorio(id, pacienteId)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir relatório')
        } finally {
            setIsDeleting(null)
        }
    }

    const handlePrint = () => {
        if (!selectedRelatorio) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const date = getRelatorioDate(selectedRelatorio)
        const content = selectedRelatorio.relatorio_gerado
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Atendimento - ${format(date, "dd/MM/yyyy", { locale: ptBR })}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        h1 {
                            font-size: 24px;
                            margin-bottom: 10px;
                            color: #1a1a1a;
                        }
                        .meta {
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 1px solid #eee;
                            color: #666;
                            font-size: 14px;
                        }
                        .content {
                            white-space: pre-wrap;
                            text-align: justify;
                        }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Atendimento</h1>
                    <div class="meta">
                        <p><strong>Data da Sessão:</strong> ${format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        <p><strong>Terapeuta:</strong> ${selectedRelatorio.terapeuta?.nome_completo || 'Não identificado'}</p>
                    </div>
                    <div class="content">${content}</div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleGeneratePDF = () => {
        if (!selectedRelatorio) return

        const date = getRelatorioDate(selectedRelatorio)
        const doc = new jsPDF()

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let yPosition = margin

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Relatório de Atendimento', margin, yPosition)
        yPosition += 10

        doc.setLineWidth(0.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Data da Sessão: ${format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition)
        yPosition += 6
        doc.text(`Terapeuta: ${selectedRelatorio.terapeuta?.nome_completo || 'Não identificado'}`, margin, yPosition)
        yPosition += 10

        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        doc.setFontSize(11)
        const content = selectedRelatorio.relatorio_gerado
        const paragraphs = content.split('\n')

        paragraphs.forEach((p) => {
            const cleanP = p.trim()
            if (!cleanP) {
                yPosition += 6
                return
            }

            const lines = doc.splitTextToSize(cleanP, maxWidth)
            const lineHeight = 6
            const blockHeight = lines.length * lineHeight
            const maxPageHeight = pageHeight - (margin * 2)

            // Se o parágrafo for maior que uma página inteira, imprime linha por linha (fallback)
            if (blockHeight > maxPageHeight) {
                lines.forEach((line: string) => {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage()
                        yPosition = margin
                    }
                    // Fallback: Left align para parágrafos gigantes para evitar cortes
                    doc.text(line, margin, yPosition)
                    yPosition += lineHeight
                })
            } else {
                // Parágrafo cabe em um bloco: verifica se cabe na página atual
                if (yPosition + blockHeight > pageHeight - margin) {
                    doc.addPage()
                    yPosition = margin
                }
                // Imprime parágrafo inteiro justificado
                doc.text(cleanP, margin, yPosition, { maxWidth: maxWidth, align: 'justify' })
                yPosition += blockHeight
            }

            yPosition += 2 // Espaço entre parágrafos
        })

        const nomeSanitizado = pacienteNome
            ? pacienteNome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
            : 'Paciente'
        const fileName = `Relatorio_${nomeSanitizado}_${format(date, 'yyyy-MM-dd')}.pdf`
        doc.save(fileName)
    }

    // Import Handlers
    const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setProcessingAI(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const extracted = await extractRelatorioFromImage(formData)

            setImportData({
                dataSessao: extracted.data_sessao || new Date().toISOString().split('T')[0],
                texto: extracted.resumo || ''
            })
            setImportingStep('review')
        } catch (error) {
            console.error(error)
            alert('Erro ao extrair dados da imagem. Verifique se o arquivo é válido.')
        } finally {
            setProcessingAI(false)
            e.target.value = ''
        }
    }

    const handleConfirmImport = async () => {
        if (!pacienteId) return
        if (!importData.dataSessao || !importData.texto) {
            alert('Preencha a data e o texto do relatório')
            return
        }

        setSavingImport(true)
        try {
            await importarRelatorioLegado({
                pacienteId: pacienteId,
                dataSessao: importData.dataSessao,
                texto: importData.texto
            })
            setIsImportModalOpen(false)
            setImportingStep('upload')
            setImportData({ dataSessao: '', texto: '' })
            router.refresh()
            alert('Relatório histórico importado com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar relatório')
        } finally {
            setSavingImport(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Relatórios de Atendimento
                </h2>
                {pacienteId && (
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 gap-2"
                        variant="secondary"
                    >
                        <Sparkles className="w-4 h-4" />
                        Importar Histórico (IA)
                    </Button>
                )}
            </div>

            {relatorios.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Nenhum relatório encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Os relatórios gerados na agenda aparecerão aqui.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {relatorios.map((relatorio) => {
                        const date = getRelatorioDate(relatorio)
                        return (
                            <div
                                key={relatorio.id}
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        {format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <User className="w-4 h-4 text-purple-500" />
                                        {relatorio.terapeuta?.nome_completo || 'Terapeuta não identificado'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${relatorio.status === 'finalizado'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {relatorio.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRelatorio(relatorio)}
                                        className="gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Visualizar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(relatorio.id)}
                                        disabled={isDeleting === relatorio.id}
                                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/30"
                                    >
                                        {isDeleting === relatorio.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog open={!!selectedRelatorio} onOpenChange={(open) => {
                if (!open) {
                    setSelectedRelatorio(null)
                    if (isPlaying) {
                        window.speechSynthesis.cancel()
                        setIsPlaying(false)
                        setSpeechSynthesisInstance(null)
                    }
                }
            }}>
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between mr-8">
                            <span>Relatório de Atendimento</span>
                        </DialogTitle>
                        <div className="text-sm text-gray-500 flex gap-4 mt-1">
                            <span>{selectedRelatorio && format(getRelatorioDate(selectedRelatorio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
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
                                    onClick={() => selectedRelatorio && handlePlayPause(selectedRelatorio.relatorio_gerado)}
                                    variant={isPlaying ? "destructive" : "default"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    {isPlaying ? <><Pause className="w-4 h-4" /> Parar</> : <><Play className="w-4 h-4" /> Ler</>}
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="gap-2">
                                    <FileDown className="w-4 h-4" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                    <Printer className="w-4 h-4" />
                                    Imprimir
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="mt-4 prose dark:prose-invert max-w-none whitespace-pre-wrap text-justify">
                                {selectedRelatorio?.relatorio_gerado}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Importar Relatório Histórico</DialogTitle>
                    </DialogHeader>

                    {importingStep === 'upload' ? (
                        <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-center space-y-4">
                                <div className="bg-purple-100 p-4 rounded-full inline-block">
                                    <Upload className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">Faça upload da foto ou PDF</h3>
                                    <p className="text-sm text-muted-foreground">
                                        A IA irá ler a data e o conteúdo automaticamente.
                                    </p>
                                </div>
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                                    {processingAI ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processando Imagem...
                                        </>
                                    ) : (
                                        'Selecionar Arquivo'
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={handleAIUpload}
                                        disabled={processingAI}
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                                Revise os dados extraídos pela IA antes de salvar.
                            </div>
                            <div className="space-y-2">
                                <Label>Data da Sessão (Histórica)</Label>
                                <Input
                                    type="date"
                                    value={importData.dataSessao}
                                    onChange={(e) => setImportData({ ...importData, dataSessao: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Conteúdo do Relatório</Label>
                                <Textarea
                                    value={importData.texto}
                                    onChange={(e) => setImportData({ ...importData, texto: e.target.value })}
                                    className="min-h-[200px]"
                                />
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
