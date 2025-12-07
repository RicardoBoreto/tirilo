'use client'

import { useState, useEffect } from 'react'
import { getAgendamentos, type Agendamento } from '@/lib/actions/agenda'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AgendaGeral() {
    const [date, setDate] = useState(new Date())
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAgenda()
    }, [date])

    const fetchAgenda = async () => {
        setLoading(true)
        try {
            // Start of day
            const start = new Date(date)
            start.setHours(0, 0, 0, 0)

            // End of day
            const end = new Date(date)
            end.setHours(23, 59, 59, 999)

            const data = await getAgendamentos(start.toISOString(), end.toISOString())
            setAgendamentos(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const nextDay = () => {
        const newDate = new Date(date)
        newDate.setDate(date.getDate() + 1)
        setDate(newDate)
    }

    const prevDay = () => {
        const newDate = new Date(date)
        newDate.setDate(date.getDate() - 1)
        setDate(newDate)
    }

    const isToday = new Date().toDateString() === date.toDateString()

    // Group by hour
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h to 20h

    const getAppointmentsForHour = (hour: number) => {
        return agendamentos.filter(app => {
            const appDate = new Date(app.data_hora_inicio)
            return appDate.getHours() === hour
        })
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Agenda Geral
                    </CardTitle>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <Button variant="ghost" size="icon" onClick={prevDay} className="h-8 w-8">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[100px] text-center">
                            {date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextDay} className="h-8 w-8">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    {isToday && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            Hoje
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Carregando agenda...</div>
                ) : (
                    <div className="divide-y divide-gray-300 dark:divide-gray-800">
                        {hours.map(hour => {
                            const apps = getAppointmentsForHour(hour)
                            return (
                                <div key={hour} className="flex group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="w-20 py-4 px-4 text-right border-r border-gray-300 dark:border-gray-800">
                                        <span className="text-sm font-medium text-gray-500">
                                            {hour.toString().padStart(2, '0')}:00
                                        </span>
                                    </div>
                                    <div className="flex-1 py-2 px-4 min-h-[80px]">
                                        {apps.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {apps.map(app => (
                                                    <div key={app.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg shadow-sm text-sm">
                                                        <div
                                                            className="w-1 h-10 rounded-full"
                                                            style={{ backgroundColor: app.sala?.cor_hex || '#3b82f6' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                {app.paciente?.nome}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {app.terapeuta?.nome_completo}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 mb-1 block w-fit ml-auto">
                                                                {app.sala?.nome || 'Sem sala'}
                                                            </Badge>
                                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${app.status === 'realizado' ? 'bg-green-100 text-green-700' :
                                                                app.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                                                                    'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center">
                                                <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
