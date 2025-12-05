'use client'

import { useState, useEffect } from 'react'
import { createAgendamento, updateAgendamento, getMeusPacientes, Agendamento } from '@/lib/actions/agenda'
import { getSalas, Sala } from '@/lib/actions/salas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format, addMinutes, setHours, setMinutes, parseISO, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NovoAgendamentoFormProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    selectedDate?: Date
    onSuccess?: () => void
    agendamentoToEdit?: Agendamento | null
}

export default function NovoAgendamentoForm({ trigger, open, onOpenChange, selectedDate, onSuccess, agendamentoToEdit }: NovoAgendamentoFormProps) {
    const [loading, setLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)
    const [pacientes, setPacientes] = useState<any[]>([])
    const [salas, setSalas] = useState<Sala[]>([])

    // Form state
    const [pacienteId, setPacienteId] = useState('')
    const [data, setData] = useState('')
    const [hora, setHora] = useState('')
    const [duracao, setDuracao] = useState('50')
    const [salaId, setSalaId] = useState('')
    const [tipoSessao, setTipoSessao] = useState('individual')
    const [observacoes, setObservacoes] = useState('')
    const [recorrencia, setRecorrencia] = useState(false)
    const [recorrenciaFim, setRecorrenciaFim] = useState('')

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

    useEffect(() => {
        if (isOpen) {
            // Fetch data when modal opens
            getMeusPacientes().then(setPacientes)
            getSalas().then(setSalas)
        }
    }, [isOpen])

    useEffect(() => {
        if (agendamentoToEdit) {
            const start = parseISO(agendamentoToEdit.data_hora_inicio)
            const end = parseISO(agendamentoToEdit.data_hora_fim)

            setPacienteId(agendamentoToEdit.id_paciente.toString())
            setData(format(start, 'yyyy-MM-dd'))
            setHora(format(start, 'HH:mm'))
            setDuracao(differenceInMinutes(end, start).toString())
            setSalaId(agendamentoToEdit.id_sala ? agendamentoToEdit.id_sala.toString() : '')
            setTipoSessao(agendamentoToEdit.tipo_sessao)
            setObservacoes(agendamentoToEdit.observacoes || '')
        } else if (selectedDate) {
            setData(format(selectedDate, 'yyyy-MM-dd'))
            setHora(format(selectedDate, 'HH:mm'))
            // Reset other fields if needed when switching from edit to new
            if (!isOpen) { // Only reset if opening fresh
                setPacienteId('')
                setSalaId('')
                setObservacoes('')
            }
        } else {
            // Defaults for new without selected date
            setData(format(new Date(), 'yyyy-MM-dd'))
            setHora('08:00')
        }
    }, [selectedDate, agendamentoToEdit, isOpen])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const dataHoraInicio = parseISO(`${data}T${hora}`)
            const dataHoraFim = addMinutes(dataHoraInicio, parseInt(duracao))

            const formData = new FormData()
            formData.append('id_paciente', pacienteId)
            formData.append('data_hora_inicio', dataHoraInicio.toISOString())
            formData.append('data_hora_fim', dataHoraFim.toISOString())
            formData.append('id_sala', salaId)
            formData.append('tipo_sessao', tipoSessao)
            formData.append('observacoes', observacoes)
            formData.append('recorrencia', recorrencia.toString())
            formData.append('recorrencia_fim', recorrenciaFim)

            let result;
            if (agendamentoToEdit) {
                result = await updateAgendamento(agendamentoToEdit.id, formData)
            } else {
                result = await createAgendamento(formData)
            }

            if (!result.success) {
                alert(`Erro: ${result.error}`)
                return
            }

            setIsOpen(false)
            if (onSuccess) onSuccess()

            // Reset form
            if (!agendamentoToEdit) {
                setPacienteId('')
                setObservacoes('')
                setRecorrencia(false)
                setRecorrenciaFim('')
            }

        } catch (error) {
            console.error(error)
            alert('Erro ao salvar agendamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {agendamentoToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Select value={pacienteId} onValueChange={setPacienteId} required>
                            <SelectTrigger className="rounded-xl h-12">
                                <SelectValue placeholder="Selecione o paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                {pacientes.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                    required
                                    className="rounded-xl h-12 pl-10"
                                />
                                <CalendarIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Hora *</Label>
                            <div className="relative">
                                <Input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    required
                                    className="rounded-xl h-12 pl-10"
                                />
                                <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {!agendamentoToEdit && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recorrencia"
                                    checked={recorrencia}
                                    onChange={(e) => setRecorrencia(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="recorrencia" className="cursor-pointer">Repetir semanalmente</Label>
                            </div>

                            {recorrencia && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Repetir até quando?</Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={recorrenciaFim}
                                            onChange={(e) => setRecorrenciaFim(e.target.value)}
                                            required={recorrencia}
                                            min={data}
                                            className="rounded-xl h-12 pl-10"
                                        />
                                        <CalendarIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Duração (min)</Label>
                            <Input
                                type="number"
                                value={duracao}
                                onChange={(e) => setDuracao(e.target.value)}
                                required
                                className="rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Sessão</Label>
                            <Select value={tipoSessao} onValueChange={setTipoSessao}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="dupla">Dupla</SelectItem>
                                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Sala</Label>
                        <Select value={salaId} onValueChange={setSalaId}>
                            <SelectTrigger className="rounded-xl h-12">
                                <SelectValue placeholder="Selecione a sala (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {salas.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor_identificacao }} />
                                            {s.nome}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Notas iniciais..."
                            className="rounded-xl resize-none h-20"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-lg font-medium bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            agendamentoToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
