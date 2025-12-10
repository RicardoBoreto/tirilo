
'use client'

import { format, isAfter, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'

interface AgendaTabProps {
    agendamentos: any[]
}

export default function AgendaTab({ agendamentos }: AgendaTabProps) {
    const now = new Date()

    // Separar em Próximos e Passados
    const proximos = agendamentos.filter(a => isAfter(parseISO(a.data_hora_inicio), now) && a.status !== 'CANCELADO')
    const historico = agendamentos.filter(a => isBefore(parseISO(a.data_hora_inicio), now) || a.status === 'CANCELADO').reverse() // Mais recentes primeiro

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REALIZADO': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'AGENDADO': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            case 'CANCELADO': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            case 'FALTA': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const AgendamentoCard = ({ item }: { item: any }) => (
        <Card className="mb-3 hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg min-w-[60px]">
                        <span className="text-xs font-bold text-gray-500 uppercase">
                            {format(parseISO(item.data_hora_inicio), 'MMM', { locale: ptBR })}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {format(parseISO(item.data_hora_inicio), 'dd')}
                        </span>
                    </div>

                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {item.tipo_sessao || 'Sessão Terapêutica'}
                            <Badge className={`text-[10px] px-1 py-0 ${getStatusColor(item.status)} border-none shadow-none`}>
                                {item.status}
                            </Badge>
                        </div>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(item.data_hora_inicio), 'HH:mm')} - {format(parseISO(item.data_hora_fim), 'HH:mm')}
                            </div>
                            {item.terapeuta && (
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {item.terapeuta.nome_completo}
                                </div>
                            )}
                            {item.sala && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {item.sala.nome}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximos Agendamentos
                </h3>
                {proximos.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento futuro encontrado.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {proximos.map(item => <AgendamentoCard key={item.id} item={item} />)}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 opacity-70">
                    <Clock className="w-5 h-5" />
                    Histórico Recente
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                    {historico.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Nenhum histórico disponível.</div>
                    ) : (
                        <div className="space-y-3 opacity-80">
                            {historico.map(item => <AgendamentoCard key={item.id} item={item} />)}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}
