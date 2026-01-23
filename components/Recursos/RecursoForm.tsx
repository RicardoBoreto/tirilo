'use client'

import { useState, useRef } from 'react'
import { createRecurso, updateRecurso, uploadRecursoFoto, Recurso } from '@/lib/actions/recursos'
import { analyzeMaterialImage } from '@/lib/actions/ai_materiais'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, X, Camera, Sparkles, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const OBJETIVOS_COMUNS = [
    'Regulação emocional',
    'Coordenação motora fina',
    'Coordenação motora grossa',
    'Comunicação',
    'Integração sensorial',
    'Foco e atenção',
    'Habilidades sociais',
    'Linguagem',
    'Cognição',
    'Criatividade',
    'Relaxamento'
]

const LOCAIS_COMUNS = [
    'Armário Azul',
    'Armário Vermelho',
    'Sala de Espera',
    'Sala Sensorial',
    'Sala de Música',
    'Sala de Artes',
    'Depósito',
    'Recepção'
]

interface RecursoFormProps {
    recurso?: Recurso
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function RecursoForm({ recurso, trigger, open, onOpenChange }: RecursoFormProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [analyzingAI, setAnalyzingAI] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form state
    const [nome, setNome] = useState(recurso?.nome_item || '')
    const [descricao, setDescricao] = useState(recurso?.descricao || '')
    const [fotoUrl, setFotoUrl] = useState(recurso?.foto_url || '')
    const [quantidade, setQuantidade] = useState(recurso?.quantidade?.toString() || '1')
    const [localizacao, setLocalizacao] = useState(recurso?.localizacao || '')
    const [status, setStatus] = useState(recurso?.status_conservacao || 'Excelente')
    const [objetivos, setObjetivos] = useState<string[]>(recurso?.objetivos_terapeuticos || [])
    const [novoObjetivo, setNovoObjetivo] = useState('')

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setSelectedFile(file)
        setUploading(true)
        setError(null) // Clear previous errors
        try {
            const formData = new FormData()
            formData.append('file', file)
            const url = await uploadRecursoFoto(formData)
            setFotoUrl(url)
        } catch (error) {
            console.error(error)
            alert('Erro ao fazer upload da foto')
        } finally {
            setUploading(false)
        }
    }

    function toggleObjetivo(obj: string) {
        if (objetivos.includes(obj)) {
            setObjetivos(objetivos.filter(o => o !== obj))
        } else {
            setObjetivos([...objetivos, obj])
        }
    }

    function addNovoObjetivo() {
        if (novoObjetivo && !objetivos.includes(novoObjetivo)) {
            setObjetivos([...objetivos, novoObjetivo])
            setNovoObjetivo('')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('nome_item', nome)
        formData.append('descricao', descricao)
        formData.append('foto_url', fotoUrl)
        formData.append('quantidade', quantidade)
        formData.append('localizacao', localizacao)
        formData.append('status_conservacao', status)
        formData.append('objetivos_terapeuticos', JSON.stringify(objetivos))

        try {
            if (recurso) {
                await updateRecurso(recurso.id, formData)
            } else {
                await createRecurso(formData)
            }
            setIsOpen(false)
            if (!recurso) {
                setNome('')
                setDescricao('')
                setFotoUrl('')
                setQuantidade('1')
                setLocalizacao('')
                setStatus('Excelente')
                setObjetivos([])
                setSelectedFile(null)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
                        {recurso ? 'Editar Recurso' : 'Novo Recurso'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Photo Upload */}
                    <div className="flex justify-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors overflow-hidden group"
                        >
                            {fotoUrl ? (
                                <>
                                    <Image src={fotoUrl} alt="Preview" fill className="object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                                        </>
                                    )}
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                            />
                        </div>
                    </div>


                    {(selectedFile || fotoUrl) && !analyzingAI && (
                        <div className="flex flex-col items-center -mt-2 space-y-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={async () => {
                                    if (!selectedFile && !fotoUrl) return
                                    setAnalyzingAI(true)
                                    setError(null)
                                    try {
                                        const formData = new FormData()
                                        if (selectedFile) {
                                            formData.append('file', selectedFile)
                                        } else {
                                            formData.append('imageUrl', fotoUrl)
                                        }
                                        const result = await analyzeMaterialImage(formData)

                                        if (result.nome && !nome) setNome(result.nome)
                                        if (result.descricao && !descricao) setDescricao(result.descricao)
                                        if (result.objetivos && Array.isArray(result.objetivos)) {
                                            const novos = result.objetivos.filter((o: string) => !objetivos.includes(o))
                                            setObjetivos([...objetivos, ...novos])
                                        }
                                        // removido o alert de sucesso para não atrapalhar
                                    } catch (error: any) {
                                        console.error(error)
                                        // Aqui definimos o erro no estado para o usuário poder copiar
                                        setError('Erro na análise IA: ' + error.message)
                                    } finally {
                                        setAnalyzingAI(false)
                                    }
                                }}
                                className="gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                            >
                                <Sparkles className="w-4 h-4" />
                                Identificar com IA
                            </Button>
                        </div>
                    )}

                    {analyzingAI && (
                        <div className="flex justify-center -mt-2 text-sm text-purple-600 animate-pulse items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Analisando imagem...
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 select-text">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm font-medium break-words">
                                {error}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Item *</Label>
                        <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            placeholder="Ex: Bola Sensorial"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Breve descrição do item, para que serve..."
                            className="rounded-xl min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantidade">Quantidade *</Label>
                            <Input
                                id="quantidade"
                                type="number"
                                min="0"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="localizacao">Localização</Label>
                            <div className="relative">
                                <Input
                                    id="localizacao"
                                    value={localizacao}
                                    onChange={(e) => setLocalizacao(e.target.value)}
                                    placeholder="Ex: Armário Azul"
                                    className="rounded-xl"
                                    list="locais-sugestoes"
                                />
                                <datalist id="locais-sugestoes">
                                    {LOCAIS_COMUNS.map(local => (
                                        <option key={local} value={local} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Status de Conservação</Label>
                        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Excelente">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        Excelente
                                    </span>
                                </SelectItem>
                                <SelectItem value="Bom">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        Bom
                                    </span>
                                </SelectItem>
                                <SelectItem value="Necessita reparo">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                        Necessita reparo
                                    </span>
                                </SelectItem>
                                <SelectItem value="Fora de uso">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        Fora de uso
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Objetivos Terapêuticos</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {objetivos.map(obj => (
                                <span
                                    key={obj}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                    {obj}
                                    <button
                                        type="button"
                                        onClick={() => toggleObjetivo(obj)}
                                        className="ml-2 hover:text-primary/70"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={novoObjetivo}
                                onChange={(e) => setNovoObjetivo(e.target.value)}
                                placeholder="Adicionar objetivo..."
                                className="rounded-xl"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addNovoObjetivo()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={addNovoObjetivo}
                                variant="outline"
                                className="rounded-xl"
                            >
                                Adicionar
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {OBJETIVOS_COMUNS.filter(obj => !objetivos.includes(obj)).map(obj => (
                                <button
                                    key={obj}
                                    type="button"
                                    onClick={() => toggleObjetivo(obj)}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    + {obj}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-lg font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Recurso'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog >
    )
}
