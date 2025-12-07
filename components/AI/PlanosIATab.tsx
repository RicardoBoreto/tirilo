import ReactMarkdown from 'react-markdown'

// Helper to strip markdown for TTS
function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6} /g, '') // Remove headers
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '') // Remove italics/lists
        .replace(/`/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
        .replace(/>/g, '') // Blockquotes
        .replace(/- /g, '') // List items
}

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Play, Pause, FileText, CheckCircle, Clock, Settings2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

type PlanoIA = {
    id: number
    created_at: string
    titulo: string
    plano_final: string
    modelo_ia: string
    terapeuta?: {
        nome_completo: string
    }
}

type Props = {
    planos: PlanoIA[]
}

export default function PlanosIATab({ planos }: Props) {
    const [selectedPlano, setSelectedPlano] = useState<PlanoIA | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speechSynthesisInstance, setSpeechSynthesisInstance] = useState<SpeechSynthesisUtterance | null>(null)

    // TTS State
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<string>('')
    const [rate, setRate] = useState([1.0])

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            const ptVoices = availableVoices.filter(v => v.lang.includes('pt'))
            setVoices(ptVoices.length > 0 ? ptVoices : availableVoices)

            // Default select first Portuguese voice
            if (ptVoices.length > 0 && !selectedVoice) {
                setSelectedVoice(ptVoices[0].name)
            }
        }

        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices

        return () => {
            window.speechSynthesis.onvoiceschanged = null
        }
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

    // Stop speaking when modal closes
    const handleOpenChange = (open: boolean) => {
        if (!open && isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            setSpeechSynthesisInstance(null)
        }
    }

    if (!planos || planos.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum plano gerado</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                    Gere um novo plano de intervenção usando a IA para que ele apareça aqui.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Planos de Intervenção Gerados
            </h3>

            <div className="grid gap-4">
                {planos.map((plano) => (
                    <Dialog key={plano.id} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <div
                                onClick={() => setSelectedPlano(plano)}
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-all cursor-pointer shadow-sm hover:shadow-md group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {plano.titulo}
                                    </h4>
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {plano.modelo_ia}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(plano.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    {plano.terapeuta && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {plano.terapeuta.nome_completo}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {plano.plano_final}
                                </p>
                            </div>
                        </DialogTrigger>

                        <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between mr-8">
                                    <span>{plano.titulo}</span>
                                </DialogTitle>
                                <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                    <span>Gerado em {format(new Date(plano.created_at), "dd/MM/yyyy HH:mm")}</span>
                                    <span>por {plano.terapeuta?.nome_completo || 'Sistema'}</span>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                                <div className="flex justify-between items-center gap-4 border-b pb-4">

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Settings2 className="w-4 h-4" />
                                                Configurar Voz
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Voz e Velocidade</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Ajuste como a leitura será feita.
                                                    </p>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="voice">Voz</Label>
                                                    <Select onValueChange={setSelectedVoice} value={selectedVoice}>
                                                        <SelectTrigger id="voice" className="h-8">
                                                            <SelectValue placeholder="Selecione uma voz" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {voices.map((voice) => (
                                                                <SelectItem key={voice.name} value={voice.name}>
                                                                    {voice.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="rate">Velocidade: {rate[0]}x</Label>
                                                    <Slider
                                                        id="rate"
                                                        max={2}
                                                        min={0.5}
                                                        step={0.1}
                                                        value={rate}
                                                        onValueChange={setRate}
                                                    />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        onClick={() => handlePlayPause(plano.plano_final)}
                                        variant={isPlaying ? "destructive" : "default"}
                                        className="gap-2"
                                    >
                                        {isPlaying ? (
                                            <>
                                                <Pause className="w-4 h-4" /> Parar Leitura
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" /> Ouvir Plano
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown>{plano.plano_final}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    )
}
