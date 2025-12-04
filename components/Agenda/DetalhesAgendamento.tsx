'use client'

import { Agendamento, updateAgendamentoStatus, deleteAgendamento } from '@/lib/actions/agenda'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, Phone, FileText, Play, X, RefreshCw, Trash2, Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import GerarPlanoModal from '@/components/AI/GerarPlanoModal'
import RelatorioModal from '@/components/Relatorios/RelatorioModal'
import { useState } from 'react'

interface DetalhesAgendamentoProps {
    agendamento: Agendamento | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (agendamento: Agendamento) => void
    onDeleteSuccess?: () => void
    onUpdateSuccess?: () => void
}

export default function DetalhesAgendamento({ agendamento, open, onOpenChange, onEdit, onDeleteSuccess, onUpdateSuccess }: DetalhesAgendamentoProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showRelatorioModal, setShowRelatorioModal] = useState(false)

    if (!agendamento) return null

    const start = parseISO(agendamento.data_hora_inicio)
    const end = parseISO(agendamento.data_hora_fim)

    async function handleStatusChange(status: string) {
        if (!confirm(`Deseja alterar o status para ${status}?`)) return
        try {
            await updateAgendamentoStatus(agendamento!.id, status)
            onOpenChange(false)
            if (onUpdateSuccess) onUpdateSuccess()
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar status')
        }
    }

    async function handleDelete(deleteFuture: boolean) {
        if (!agendamento) return
        if (!confirm(deleteFuture ? 'Tem certeza que deseja excluir este e todos os agendamentos futuros deste paciente?' : 'Tem certeza que deseja excluir apenas este agendamento?')) return

        try {
            const result = await deleteAgendamento(agendamento.id, deleteFuture)
            if (result.success) {
                setShowDeleteConfirm(false)
                onOpenChange(false)
                if (onDeleteSuccess) onDeleteSuccess()
            } else {
                alert('Erro ao excluir: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir agendamento')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden">
                <div className="bg-primary/10 p-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mb-3 relative">
                        {agendamento.paciente?.foto_url ? (
                            <Image
                                src={agendamento.paciente.foto_url}
                                alt={agendamento.paciente.nome}
                                fill
                                className="object-cover rounded-full"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                {agendamento.paciente?.nome.charAt(0)}
                            </div>
                        )}
                        <div className={cn(
                            "absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white",
                            agendamento.status === 'agendado' ? "bg-blue-500" :
                                agendamento.status === 'realizado' ? "bg-green-500" :
                                    agendamento.status === 'cancelado' ? "bg-red-500" : "bg-gray-500"
                        )} />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {agendamento.paciente?.nome}
                    </DialogTitle>
                    <p className="text-primary font-medium">
                        {agendamento.tipo_sessao === 'individual' ? 'Sessão Individual' :
                            agendamento.tipo_sessao === 'dupla' ? 'Sessão em Dupla' : 'Avaliação'}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-gray-400">Data</p>
                                <p className="font-medium">{format(start, "dd 'de' MMMM", { locale: ptBR })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-gray-400">Horário</p>
                                <p className="font-medium">
                                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                </p>
                            </div>
                        </div>
                        {agendamento.sala && (
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 col-span-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-gray-400">Sala</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agendamento.sala.cor_hex }} />
                                        <p className="font-medium">{agendamento.sala.nome}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {agendamento.observacoes && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Observações</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {agendamento.observacoes}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        <GerarPlanoModal pacienteId={agendamento.id_paciente} />

                        <Button
                            className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            onClick={() => setShowRelatorioModal(true)}
                        >
                            <Sparkles className="w-6 h-6 mr-2 fill-current" />
                            Registrar Atendimento (IA)
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                    if (onEdit) {
                                        onEdit(agendamento)
                                        onOpenChange(false)
                                    }
                                }}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reagendar
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Excluir Agendamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-gray-600">Como você deseja excluir este agendamento?</p>
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                variant="outline"
                                className="h-12 justify-start"
                                onClick={() => handleDelete(false)}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Apenas este agendamento
                            </Button>
                            <Button
                                variant="destructive"
                                className="h-12 justify-start bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(true)}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Este e todos os futuros
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="w-full">
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {agendamento && (
                <RelatorioModal
                    agendamento={agendamento}
                    open={showRelatorioModal}
                    onOpenChange={setShowRelatorioModal}
                    onSuccess={() => {
                        if (onUpdateSuccess) onUpdateSuccess()
                        onOpenChange(false)
                    }}
                />
            )}
        </Dialog >
    )
}
