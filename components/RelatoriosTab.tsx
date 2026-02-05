'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Eye, User, Calendar, Printer, FileDown, Upload, Loader2, Sparkles, Trash2, Play, Pause, Settings2, Edit, Save, X, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { extractRelatorioFromImage, importarRelatorioLegado, deleteRelatorio, toggleVisibilidadeRelatorio, saveRelatorio } from '@/lib/actions/relatorios'
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
    texto_bruto: string
    id_agendamento: number
    id_paciente: number
    id_prompt_ia: number | null
    status: string
    visivel_familia?: boolean
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

    // Edição
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState('')
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    useEffect(() => {
        if (selectedRelatorio) {
            setEditedText(selectedRelatorio.relatorio_gerado)
            setIsEditing(false)
        }
    }, [selectedRelatorio])

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

    const handleToggleVisibility = async (id: number, current: boolean) => {
        try {
            await toggleVisibilidadeRelatorio(id, !current)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao alterar visibilidade')
        }
    }

    const handleSaveEdit = async () => {
        if (!selectedRelatorio) return

        setIsSavingEdit(true)
        try {
            const result = await saveRelatorio({
                id_agendamento: selectedRelatorio.id_agendamento,
                id_paciente: selectedRelatorio.id_paciente,
                texto_bruto: selectedRelatorio.texto_bruto,
                relatorio_gerado: editedText,
                id_prompt_ia: selectedRelatorio.id_prompt_ia,
                status: selectedRelatorio.status as 'rascunho' | 'finalizado'
            })

            if (result.success) {
                // Atualiza estado local
                setSelectedRelatorio({
                    ...selectedRelatorio,
                    relatorio_gerado: editedText
                })
                setIsEditing(false)
                router.refresh()
                // alert('Relatório atualizado com sucesso!') (Opcional, feedback visual já existe pelo estado de edição fechando)
            } else {
                alert('Erro ao salvar: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar edição')
        } finally {
            setIsSavingEdit(false)
        }
    }

    const handlePrint = () => {
        if (!selectedRelatorio) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const date = getRelatorioDate(selectedRelatorio)
        const content = selectedRelatorio.relatorio_gerado
            .split('\n')
            .map(line => {
                const cleanLine = line.trim();

                // Page Break
                if (cleanLine === '---' || cleanLine === '***' || cleanLine.toUpperCase() === '[QUEBRA]') {
                    return '<div class="page-break"></div>';
                }

                // Bullet Points
                // Regex ajustado: Ignora ** (negrito)
                if (cleanLine.match(/^([*•-](?!\*)\s?)/)) {
                    const text = cleanLine.replace(/^([*•-](?!\*)\s?)/, '');
                    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return `<div class="bullet-point"><span>•</span> <span>${formattedText}</span></div>`;
                }

                // Normal Paragraph
                if (cleanLine === '') return '<br>';

                return `<p>${cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
            })
            .join('')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 2cm;
                        }
                        h1 {
                            font-size: 24px;
                            margin-bottom: 10px;
                            color: #1a1a1a;
                        }

                        .content {
                            text-align: justify;
                        }
                        .content p {
                            margin: 0 0 10px 0;
                        }
                        .page-break { 
                            page-break-after: always; 
                            height: 0; 
                            margin: 0;
                        }
                        .bullet-point {
                            display: flex;
                            gap: 10px;
                            margin-bottom: 5px;
                            padding-left: 20px;
                        }
                        @media print {
                            @page { margin: 0; }
                            body { padding: 2cm !important; margin: 0 !important; }
                            .no-print { display: none; }
                            .page-break { break-after: page; }
                        }
                    </style>
                </head>
                <body>


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

        // Cabeçalho (Removido para evitar duplicação)
        // doc.setFontSize(18)
        // doc.setFont('helvetica', 'bold')
        // doc.text('Relatório de Atendimento', margin, yPosition)
        // yPosition += 10

        // doc.setLineWidth(0.5)
        // doc.line(margin, yPosition, pageWidth - margin, yPosition)
        // yPosition += 10

        // Metadados
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Data da Sessão: ${format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition)
        yPosition += 6
        doc.text(`Terapeuta: ${selectedRelatorio.terapeuta?.nome_completo || 'Não identificado'}`, margin, yPosition)
        yPosition += 10

        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        // Conteúdo
        doc.setFontSize(11)
        const content = selectedRelatorio.relatorio_gerado
        const paragraphs = content.split('\n')
        // Variável de line-height
        const lineHeight = 6

        paragraphs.forEach((p) => {
            let cleanP = p.trim()
            if (!cleanP) {
                yPosition += 6
                return
            }

            // [NOVO] DETECTOR DE QUEBRA DE PÁGINA MANUAL
            if (cleanP === '---' || cleanP === '***' || cleanP.toUpperCase() === '[QUEBRA]') {
                doc.addPage()
                yPosition = margin
                return
            }

            // 1. Detectar Bullet Points (*, -, •)
            let isBullet = false
            // Regex ajustado: Aceita *, -, • mas rejeita se for ** (início de negrito)
            const bulletMatch = cleanP.match(/^([*•-](?!\*)\s?)/)
            if (bulletMatch) {
                isBullet = true
                cleanP = cleanP.slice(bulletMatch[0].length)
            }

            // 2. Configurar Margens e Check de Página
            const contentMargin = isBullet ? margin + 5 : margin
            const contentWidth = isBullet ? maxWidth - 5 : maxWidth

            // Função para verificar quebra de página
            const checkPageBreak = () => {
                if (yPosition > pageHeight - margin) {
                    doc.addPage()
                    yPosition = margin
                }
            }

            // 3. Desenhar Bullet se necessário
            if (isBullet) {
                checkPageBreak()
                doc.setFontSize(14)
                doc.text('•', margin, yPosition)
                doc.setFontSize(11) // Volta ao tamanho normal
            }

            // 4. Parser de Bold (** e *) e Preparação de Palavras
            // O objetivo é transformar todo o parágrafo em uma lista única de palavras com suas propriedades (bold/normal)
            const parts = cleanP.split(/(\*\*.*?\*\*|\*.*?\*)/g)
            let allWords: { text: string, isBold: boolean, width: number }[] = []

            parts.forEach(part => {
                const isDoubleBold = part.startsWith('**') && part.endsWith('**')
                const isSingleBold = part.startsWith('*') && part.endsWith('*')
                const isBold = isDoubleBold || isSingleBold

                let text = part
                if (isDoubleBold) text = part.slice(2, -2)
                else if (isSingleBold) text = part.slice(1, -1)

                if (!text) return

                doc.setFont('helvetica', isBold ? 'bold' : 'normal')
                const words = text.split(/\s+/)

                words.forEach((word) => {
                    if (!word) return
                    allWords.push({
                        text: word,
                        isBold,
                        width: doc.getTextWidth(word)
                    })
                })
            })

            // 5. Renderização Unificada (Manual Justification)
            let currentLine: typeof allWords = []
            let currentLineWidth = 0
            const standardSpaceWidth = doc.getTextWidth(' ')

            allWords.forEach((wordObj, index) => {
                const isFirst = currentLine.length === 0
                // Espaço padrão apenas para cálculo de quebra ("vai caber?")
                const addedWidth = (isFirst ? 0 : standardSpaceWidth) + wordObj.width

                if (currentLineWidth + addedWidth > contentWidth) {
                    // A linha estourou a largura -> Precisamos imprimir a linha atual JUSTIFICADA
                    checkPageBreak()

                    const wordsWidth = currentLine.reduce((acc, w) => acc + w.width, 0)
                    const availableSpace = contentWidth - wordsWidth
                    const gaps = currentLine.length - 1

                    // Se houver espaços (gaps), distribuímos o espaço disponível. Se for palavra única, alinha à esquerda.
                    const spaceWidth = gaps > 0 ? availableSpace / gaps : 0

                    let x = contentMargin
                    currentLine.forEach((w, i) => {
                        doc.setFont('helvetica', w.isBold ? 'bold' : 'normal')
                        doc.text(w.text, x, yPosition)
                        if (i < gaps) x += w.width + spaceWidth
                    })

                    yPosition += lineHeight

                    // Começa nova linha com a palavra que estourou
                    currentLine = [wordObj]
                    currentLineWidth = wordObj.width
                } else {
                    // Cabe na linha -> Adiciona
                    currentLine.push(wordObj)
                    currentLineWidth += addedWidth
                }
            })

            // 6. Última linha (Sempre alinhada à Esquerda)
            if (currentLine.length > 0) {
                checkPageBreak()
                let x = contentMargin
                currentLine.forEach((w, i) => {
                    doc.setFont('helvetica', w.isBold ? 'bold' : 'normal')
                    doc.text(w.text, x, yPosition)
                    if (i < currentLine.length - 1) x += w.width + standardSpaceWidth
                })
                yPosition += lineHeight
            }

            yPosition += 2 // Espaço extra após parágrafo
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
                                        {relatorio.visivel_familia && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Família
                                            </span>
                                        )}
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

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 border-r pr-4 border-gray-200 dark:border-gray-700">
                                    <Label htmlFor="visibilidade" className="text-sm font-medium cursor-pointer">
                                        Liberar Família
                                    </Label>
                                    <Switch
                                        id="visibilidade"
                                        checked={selectedRelatorio?.visivel_familia || false}
                                        onCheckedChange={(c) => {
                                            if (selectedRelatorio) {
                                                handleToggleVisibility(selectedRelatorio.id, selectedRelatorio.visivel_familia || false)
                                                setSelectedRelatorio({ ...selectedRelatorio, visivel_familia: c })
                                            }
                                        }}
                                    />
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
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900 relative">
                            {isEditing ? (
                                <div className="h-full flex flex-col gap-2">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md text-xs text-blue-800 dark:text-blue-200 flex gap-2">
                                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold mb-1">Dicas de Formatação para PDF:</p>
                                            <ul className="list-disc pl-4 space-y-0.5">
                                                <li>Use <strong>**negrito**</strong> para destacar termos.</li>
                                                <li>Inicie linhas com <strong>*</strong> ou <strong>-</strong> para criar listas (bullet points).</li>
                                                <li>Digite <strong>---</strong> ou <strong>[QUEBRA]</strong> em uma linha separada para forçar nova página.</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="flex-1 w-full resize-none border-none focus-visible:ring-0 bg-transparent p-0 font-sans"
                                    />
                                </div>
                            ) : (
                                <div className="mt-4 prose dark:prose-invert max-w-none whitespace-pre-wrap text-justify">
                                    {selectedRelatorio?.relatorio_gerado}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            {isEditing ? (
                                <>
                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                    <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                                        {isSavingEdit ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Salvar Alterações
                                    </Button>
                                </>
                            ) : (
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Texto
                                </Button>
                            )}
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
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
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
