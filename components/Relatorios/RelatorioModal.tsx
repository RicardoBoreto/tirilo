'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Save, CheckCircle, MessageSquare } from 'lucide-react'
import { getActivePrompts, PromptIA } from '@/lib/actions/ai_prompts'
import { generateSessionReport } from '@/lib/actions/ai_generation'
import { saveRelatorio, getRelatorioByAgendamento } from '@/lib/actions/relatorios'
import { Agendamento } from '@/lib/actions/agenda'

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
    const [relatorioGerado, setRelatorioGerado] = useState('')
    const [ajusteIA, setAjusteIA] = useState('')
    const [status, setStatus] = useState<'rascunho' | 'finalizado'>('rascunho')

    useEffect(() => {
        if (open) {
            // Fetch prompts
            getActivePrompts().then(data => {
                // Filter: Only 'relatorio'
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
        try {
            const result = await generateSessionReport(
                Number(selectedPromptId),
                agendamento.id_paciente,
                textoBruto,
                agendamento.data_hora_inicio
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
                alert('Erro ao salvar: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    // Simple "Chat" simulation: Append request to text and regenerate? 
    // Or call a specific "Refine" endpoint?
    // For MVP, let's append the request to the raw text or just re-generate with context?
    // Actually, the user wants to "conversar".
    // Let's implement a simple "Refine" button that sends the current report + request to AI.
    // But `generateSessionReport` uses the prompt template.
    // Maybe I should add a `refineSessionReport` action?
    // For now, I'll just let them edit manually or re-generate with modified raw text.
    // Wait, "conversar com a IA" implies interaction.
    // I'll add a "Solicitar Ajuste" that calls `generateSessionReport` but appends the request to the `relatoSessao`?
    // E.g. "Relato: ... [Ajuste: ...]"
    // This is a simple hack that might work if the prompt handles it.
    // Or I can just append the adjustment request to the `textoBruto` and re-generate.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        Relatório de Atendimento com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/50">
                    {/* Left Column: Input */}
                    <div className="space-y-4 flex flex-col h-full">
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

                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label>Anotações da Sessão (O que aconteceu?)</Label>
                            <Textarea
                                value={textoBruto}
                                onChange={e => setTextoBruto(e.target.value)}
                                placeholder="Descreva os acontecimentos, comportamentos e intervenções..."
                                className="flex-1 resize-none bg-white dark:bg-gray-800 p-4 text-base focus:ring-emerald-500"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={generating || !textoBruto}
                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-12 text-lg shadow-lg shadow-emerald-500/20"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Gerando Relatório...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Gerar Relatório com IA
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right Column: Output */}
                    <div className="space-y-4 flex flex-col h-full">
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label className="flex justify-between">
                                <span>Relatório Gerado (Editável)</span>
                                {status === 'finalizado' && <span className="text-green-600 font-bold flex items-center text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Finalizado</span>}
                            </Label>
                            <Textarea
                                value={relatorioGerado}
                                onChange={e => setRelatorioGerado(e.target.value)}
                                placeholder="O relatório gerado pela IA aparecerá aqui..."
                                className="flex-1 resize-none bg-white dark:bg-gray-800 p-4 text-base leading-relaxed border-emerald-100 dark:border-emerald-900 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Chat/Refine - Placeholder for future iteration or simple implementation */}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <Label className="text-xs text-gray-500 mb-2 block">Solicitar Ajuste à IA (Beta)</Label>
                            <div className="flex gap-2">
                                <Textarea
                                    value={ajusteIA}
                                    onChange={e => setAjusteIA(e.target.value)}
                                    placeholder="Ex: Reescreva focando mais na regulação emocional..."
                                    className="h-10 min-h-[40px] resize-none text-sm"
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                        if (!ajusteIA) return;
                                        setTextoBruto(prev => prev + `\n\n[Solicitação de Ajuste: ${ajusteIA}]`);
                                        setAjusteIA('');
                                        // Optionally auto-trigger generate
                                        // handleGenerate(); 
                                        alert('Solicitação adicionada às anotações. Clique em "Gerar Relatório" novamente para processar.');
                                    }}
                                >
                                    <MessageSquare className="w-4 h-4 text-purple-600" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white dark:bg-gray-800 gap-2">
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
