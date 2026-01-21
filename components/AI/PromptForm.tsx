'use client'

import { useState, useEffect } from 'react'
import { createPrompt, updatePrompt, PromptIA, getPromptById } from '@/lib/actions/ai_prompts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Sparkles } from 'lucide-react'

interface PromptFormProps {
    trigger?: React.ReactNode
    promptToEdit?: any // Using any for flexibility with shallow objects
    onSuccess?: () => void
    terapeutas?: any[]
    isAdmin?: boolean
    readOnly?: boolean
    initialData?: any
    currentUserId?: string
}

export default function PromptForm({
    trigger,
    promptToEdit,
    onSuccess,
    terapeutas = [],
    isAdmin = false,
    readOnly = false,
    initialData,
    currentUserId
}: PromptFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [promptData, setPromptData] = useState<any>(null)
    const [fetchingData, setFetchingData] = useState(false)
    const [renderError, setRenderError] = useState<string | null>(null)

    // Keep track of the last source ID to avoid refetching the same data
    const sourceId = promptToEdit?.id || initialData?.id

    // Reset promptData when dialog closes to avoid stale data
    useEffect(() => {
        if (!open) {
            setPromptData(null)
            setRenderError(null)
        }
    }, [open])

    useEffect(() => {
        if (open && sourceId && !promptData) {
            setFetchingData(true)
            setRenderError(null)
            getPromptById(sourceId)
                .then(fullData => {
                    if (fullData) {
                        setPromptData(fullData)
                    }
                })
                .catch(err => {
                    console.error("Erro ao carregar prompt completo:", err)
                    setRenderError("Erro ao carregar dados do prompt")
                })
                .finally(() => setFetchingData(false))
        }
    }, [open, sourceId])

    // Data source priority: Fetched > Edit > Initial/Clone > Empty
    const data = promptData || (promptToEdit || initialData || {})

    async function handleSubmit(formData: FormData) {
        if (readOnly) return
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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl">
                <DialogHeader className="p-6 border-b border-gray-100">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {readOnly ? 'Visualizar Prompt' : (promptToEdit ? 'Editar Prompt IA' : (initialData ? 'Clonar Prompt IA' : 'Novo Prompt IA'))}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {readOnly ? 'Visualize as configurações e o texto do prompt.' : 'Configure os detalhes e o texto do seu prompt de inteligência artificial.'}
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    {fetchingData ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                            <p className="text-sm text-gray-500 animate-pulse font-medium">Carregando dados completos do estilo e prompt...</p>
                        </div>
                    ) : renderError ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                            <p className="text-sm text-red-600 font-medium">{renderError}</p>
                            <Button type="button" onClick={() => setOpen(false)} variant="outline">Fechar</Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {isAdmin && (
                                <div className="space-y-2">
                                    <Label>Terapeuta Dono</Label>
                                    <Select name="terapeuta_id" defaultValue={data?.terapeuta_id || currentUserId || ''} disabled={readOnly}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Selecione um terapeuta (ou deixe vazio para você)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={currentUserId || 'me'} className="font-bold text-purple-600">Eu (Admin - Template da Clínica)</SelectItem>
                                            {terapeutas.filter((t: any) => t.id !== currentUserId).map((t: any) => (
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
                                        defaultValue={initialData ? `Cópia de ${data?.nome_prompt || ''}` : (data?.nome_prompt || '')}
                                        placeholder="Ex: Dra. Clara - Plano 50min"
                                        required
                                        className="rounded-xl"
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select name="categoria" defaultValue={data.categoria || 'plano'} disabled={readOnly}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="plano">Plano de Intervenção</SelectItem>
                                            <SelectItem value="relatorio">Relatório de Atendimento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Modelo Gemini</Label>
                                <Select name="modelo_gemini" defaultValue={data.modelo_gemini || 'gemini-2.5-flash'} disabled={readOnly}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Novo)</SelectItem>
                                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Legado)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição Curta</Label>
                                <Input
                                    name="descricao"
                                    defaultValue={data.descricao || ''}
                                    placeholder="Ex: Focado em crianças com TEA leve"
                                    className="rounded-xl"
                                    readOnly={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    <span>Texto do Prompt (System Prompt)</span>
                                    <span className="text-xs text-gray-500">Use as variáveis: {'{{NOME}}'}, {'{{IDADE}}'}, etc.</span>
                                </Label>
                                <Textarea
                                    name="prompt_texto"
                                    defaultValue={data?.prompt_texto || ''}
                                    placeholder="Você é um especialista..."
                                    required
                                    className="min-h-[300px] font-mono text-sm rounded-xl resize-y"
                                    readOnly={readOnly}
                                />
                            </div>

                            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                                <details className="group">
                                    <summary className="flex items-center justify-between cursor-pointer font-medium text-sm text-blue-700 dark:text-blue-300">
                                        <span>📚 Ver lista de variáveis disponíveis (Chaves)</span>
                                        <span className="transition-transform group-open:rotate-180">▼</span>
                                    </summary>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 max-h-[300px] overflow-y-auto pr-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🧑‍⚕️ Terapeuta</h4>
                                            <ul className="space-y-2 list-none">
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_NOME}}"}</code>: Nome completo do usuario logado.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_FORMACAO}}"}</code>: Formação acadêmica.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_TECNICAS_PREFERIDAS}}"}</code>: Técnicas preferidas.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_RECURSOS_PREFERIDOS}}"}</code>: Recursos preferidos.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_ESTILO_CONDUCAO}}"}</code>: Estilo de condução.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_OBSERVACOES}}"}</code>: Observações clínicas.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-blue-600">{"{{TERAPEUTA_CREDENCIAL_COM_REGISTRO}}"}</code>: Nome + Registro Profissional.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">👶 Paciente</h4>
                                            <ul className="space-y-2 list-none">
                                                <li><code className="bg-white px-1 rounded border font-bold text-green-600">{"{{NOME}}"}</code>: Nome do paciente.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-green-600">{"{{IDADE}}"}</code>: Idade calculada.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-green-600">{"{{DIAGNOSTICO}}"}</code>: Diagnóstico principal e histórico.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-green-600">{"{{PREFERENCIAS}}"}</code>: Preferências (musicoterapia).</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-green-600">{"{{SENSIBILIDADES}}"}</code>: Sensibilidades motoras/sensoriais.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📝 Histórico/Contexto</h4>
                                            <ul className="space-y-2 list-none">
                                                <li><code className="bg-white px-1 rounded border font-bold text-purple-600">{"{{ULTIMAS_SESSOES}}"}</code>: Resumo das 3 últimas sessões.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-purple-600">{"{{HISTORICO_RELATORIOS}}"}</code>: Últimos 3 relatórios gerados.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-purple-600">{"{{OBJETIVO_PRINCIPAL_PLANO}}"}</code>: Último plano terapêutico.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-purple-600">{"{{DATA_SESSAO}}"}</code>: Data de hoje.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🏥 Outros</h4>
                                            <ul className="space-y-2 list-none">
                                                <li><code className="bg-white px-1 rounded border font-bold text-gray-600">{"{{RECURSOS_LISTA}}"}</code>: Todos recursos cadastrados.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-gray-600">{"{{SALAS_LISTA}}"}</code>: Todas salas cadastradas.</li>
                                                <li><code className="bg-white px-1 rounded border font-bold text-gray-600">{"{{RELATO_SESSAO}}"}</code>: Texto digitado pelo terapeuta.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </details>
                            </div>

                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
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
                                        defaultValue={data?.temperatura ?? 0.7}
                                        className="rounded-xl bg-white"
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>

                            {!readOnly && (promptToEdit || initialData) && (
                                <div className="flex items-center gap-2 p-1">
                                    <Switch name="ativo" defaultChecked={data?.ativo !== false} value="true" />
                                    <Label>Prompt Ativo</Label>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                            {readOnly ? 'Fechar' : 'Cancelar'}
                        </Button>
                        {!readOnly && (
                            <Button
                                type="submit"
                                disabled={loading || fetchingData}
                                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (initialData ? 'Clonar Prompt' : 'Salvar Prompt')}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
