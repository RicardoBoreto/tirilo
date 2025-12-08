'use client'

import { useState, useEffect } from 'react'
import { Agendamento } from '@/lib/actions/agenda'
import {
    format, startOfWeek, addDays, isSameDay, parseISO,
    isSameMonth, addWeeks, subWeeks, startOfMonth, endOfMonth,
    startOfDay, endOfDay, addMonths, subMonths, getDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, FileText, LayoutList, CalendarRange, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NovoAgendamentoForm from './NovoAgendamentoForm'
import DetalhesAgendamento from './DetalhesAgendamento'


interface AgendaCalendarProps {
    agendamentos: Agendamento[]
}

type ViewMode = 'day' | 'week' | 'month'

export default function AgendaCalendar({ agendamentos }: AgendaCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showNovoAgendamento, setShowNovoAgendamento] = useState(false)
    const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
    const [agendamentoToEdit, setAgendamentoToEdit] = useState<Agendamento | null>(null)
    const [agendamentosList, setAgendamentosList] = useState<Agendamento[]>(agendamentos)

    const HOURS = Array.from({ length: 13 }).map((_, i) => i + 7) // 07:00 to 19:00

    function next() {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1))
        if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    }

    function prev() {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1))
        if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    }

    function fetchAgendamentos() {
        let start: Date, end: Date

        if (viewMode === 'day') {
            start = startOfDay(currentDate)
            end = endOfDay(currentDate)
        } else if (viewMode === 'week') {
            start = startOfWeek(currentDate, { weekStartsOn: 1 })
            end = addDays(start, 7)
        } else {
            start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
            end = addWeeks(endOfMonth(currentDate), 1) // Buffer for calendar grid
        }

        import('@/lib/actions/agenda').then(({ getAgendamentos }) => {
            getAgendamentos(start.toISOString(), end.toISOString()).then(setAgendamentosList)
        })
    }

    useEffect(() => {
        fetchAgendamentos()
    }, [currentDate, viewMode])

    function getAgendamentosForSlot(date: Date, hour: number) {
        return agendamentosList.filter(a => {
            const aDate = parseISO(a.data_hora_inicio)
            return isSameDay(aDate, date) && aDate.getHours() === hour
        })
    }

    function getAgendamentosForDay(date: Date) {
        return agendamentosList.filter(a => {
            const aDate = parseISO(a.data_hora_inicio)
            return isSameDay(aDate, date)
        })
    }

    // --- Render Helpers ---

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Button variant="ghost" size="icon" onClick={prev} className="rounded-xl">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center min-w-[180px]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium capitalize">
                        {viewMode === 'day' && format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        {viewMode === 'week' && `Semana ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd')} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 5), 'dd')}`}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={next} className="rounded-xl">
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-2 flex gap-1">
                    <Button
                        variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('day')}
                        className={cn("rounded-lg h-8", viewMode === 'day' && "bg-white shadow-sm")}
                    >
                        <LayoutList className="w-4 h-4 mr-2" />
                        Dia
                    </Button>
                    <Button
                        variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('week')}
                        className={cn("rounded-lg h-8", viewMode === 'week' && "bg-white shadow-sm")}
                    >
                        <CalendarRange className="w-4 h-4 mr-2" />
                        Semana
                    </Button>
                    <Button
                        variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                        className={cn("rounded-lg h-8", viewMode === 'month' && "bg-white shadow-sm")}
                    >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Mês
                    </Button>
                </div>

                <Button
                    variant="outline"
                    className="flex-1 sm:flex-none rounded-xl border-gray-200"
                    onClick={() => setCurrentDate(new Date())}
                >
                    Hoje
                </Button>
                <Button
                    className="flex-1 sm:flex-none rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={() => setShowNovoAgendamento(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo
                </Button>
            </div>
        </div>
    )

    const renderDayView = () => (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {HOURS.map(hour => {
                    const slotAgendamentos = getAgendamentosForSlot(currentDate, hour)
                    return (
                        <div key={hour} className="grid grid-cols-[80px_1fr] min-h-[100px] border-b border-gray-300 dark:border-gray-700">
                            <div className="p-4 text-sm font-medium text-gray-400 text-right border-r border-gray-300 dark:border-gray-700 bg-gray-50/30">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            <div className="relative p-2 group hover:bg-gray-50/50 transition-colors">
                                <button
                                    onClick={() => {
                                        const date = new Date(currentDate)
                                        date.setHours(hour, 0, 0, 0)
                                        setSelectedDate(date)
                                        setShowNovoAgendamento(true)
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-green-50/50 dark:bg-green-900/10 transition-opacity z-10"
                                >
                                    <Plus className="w-6 h-6 text-green-600" />
                                </button>
                                <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {slotAgendamentos.map(agendamento => (
                                        <div
                                            key={agendamento.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedAgendamento(agendamento) }}
                                            className={cn(
                                                "p-3 rounded-xl text-sm font-medium cursor-pointer shadow-sm border transition-all hover:scale-[1.01] flex items-center gap-3",
                                                agendamento.status === 'agendado' ? "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100" :
                                                    agendamento.status === 'concluido' ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100" :
                                                        "bg-gray-200 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: agendamento.sala?.cor_hex || '#ccc' }} />
                                            <div className="flex-1">
                                                <div className="font-bold">{agendamento.paciente?.nome}</div>
                                                <div className="text-xs opacity-80 flex gap-2">
                                                    <span>{format(parseISO(agendamento.data_hora_inicio), 'HH:mm')}</span>
                                                    <span>•</span>
                                                    <span>{agendamento.sala?.nome || 'Sem sala'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const renderWeekView = () => {
        const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startDate, i))

        return (
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b border-gray-100 dark:border-gray-700">
                    <div className="p-4 border-r border-gray-50 bg-gray-50/50"></div>
                    {weekDays.map((day, index) => {
                        const isToday = isSameDay(day, new Date())
                        const isEvenColumn = index % 2 === 0

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "p-4 text-center border-r border-gray-100 dark:border-gray-700 last:border-r-0",
                                    isToday
                                        ? "bg-blue-100 dark:bg-blue-900/40"
                                        : isEvenColumn
                                            ? "bg-gray-200 dark:bg-gray-800"
                                            : "bg-white dark:bg-gray-900"
                                )}
                            >
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                    {format(day, 'EEE', { locale: ptBR })}
                                </p>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold",
                                    isSameDay(day, new Date()) ? "bg-primary text-white shadow-md" : "text-gray-900"
                                )}>
                                    {format(day, 'dd')}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {HOURS.map(hour => (
                        <div key={hour} className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] min-h-[100px]">
                            <div className="p-2 text-xs font-medium text-gray-400 text-right border-r border-b border-gray-50 bg-gray-50/30 sticky left-0">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, index) => {
                                const slotAgendamentos = getAgendamentosForSlot(day, hour)
                                const isToday = isSameDay(day, new Date())
                                const isEvenColumn = index % 2 === 0

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={cn(
                                            "border-r border-b border-gray-100 dark:border-gray-700 p-1 relative group transition-colors",
                                            // Stronger colors for visibility
                                            isToday
                                                ? "bg-blue-50 dark:bg-blue-900/20"
                                                : isEvenColumn
                                                    ? "bg-gray-100 dark:bg-gray-800/60"
                                                    : "bg-white dark:bg-gray-900"
                                        )}
                                    >
                                        <button
                                            onClick={() => {
                                                const date = new Date(day)
                                                date.setHours(hour, 0, 0, 0)
                                                setSelectedDate(date)
                                                setShowNovoAgendamento(true)
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-green-50/50 transition-opacity z-10"
                                        >
                                            <Plus className="w-6 h-6 text-green-600" />
                                        </button>
                                        <div className="relative z-20 space-y-1">
                                            {slotAgendamentos.map(agendamento => (
                                                <div
                                                    key={agendamento.id}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedAgendamento(agendamento) }}
                                                    className={cn(
                                                        "p-2 rounded-xl text-xs font-medium cursor-pointer shadow-sm border transition-all hover:scale-[1.02]",
                                                        agendamento.status === 'agendado' ? "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100" :
                                                            agendamento.status === 'concluido' ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100" :
                                                                "bg-gray-200 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                                    )}
                                                >
                                                    <div className="font-bold break-words leading-tight">{agendamento.paciente?.nome}</div>
                                                    <div className="flex items-center justify-between mt-1 opacity-80">
                                                        <span>{format(parseISO(agendamento.data_hora_inicio), 'HH:mm')}</span>
                                                        {agendamento.sala && (
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agendamento.sala.cor_hex }} title={agendamento.sala.nome} />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6) // Ensure full week rows

        // Generate days
        const days = []
        let day = startDate
        while (day <= endDate) {
            days.push(day)
            day = addDays(day, 1)
        }

        return (
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="p-3 text-center text-xs font-bold text-gray-400 uppercase bg-gray-50/50">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto bg-gray-200 dark:bg-gray-700 gap-0.5 border border-gray-200 dark:border-gray-700">
                    {days.map((day, index) => {
                        const dayAgendamentos = getAgendamentosForDay(day)
                        const isCurrentMonth = isSameMonth(day, monthStart)

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "p-2 min-h-[100px] relative group transition-colors",
                                    !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white dark:bg-gray-800",
                                    isSameDay(day, new Date()) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                                )}
                                onClick={() => {
                                    setCurrentDate(day)
                                    setViewMode('day')
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                        isSameDay(day, new Date()) ? "bg-primary text-white" : ""
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayAgendamentos.length > 0 && (
                                        <span className="text-xs font-medium text-gray-400">{dayAgendamentos.length}</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {dayAgendamentos.slice(0, 3).map(agendamento => (
                                        <div key={agendamento.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                            {format(parseISO(agendamento.data_hora_inicio), 'HH:mm')} {agendamento.paciente?.nome}
                                        </div>
                                    ))}
                                    {dayAgendamentos.length > 3 && (
                                        <div className="text-[10px] text-gray-400 pl-1">
                                            + {dayAgendamentos.length - 3} mais
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {renderHeader()}

            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}

            <NovoAgendamentoForm
                open={showNovoAgendamento}
                onOpenChange={(open) => {
                    setShowNovoAgendamento(open)
                    if (!open) setAgendamentoToEdit(null)
                }}
                selectedDate={selectedDate}
                onSuccess={fetchAgendamentos}
                agendamentoToEdit={agendamentoToEdit}
            />

            <DetalhesAgendamento
                agendamento={selectedAgendamento}
                open={!!selectedAgendamento}
                onOpenChange={(open) => !open && setSelectedAgendamento(null)}
                onEdit={(agendamento) => {
                    setAgendamentoToEdit(agendamento)
                    setShowNovoAgendamento(true)
                }}
                onDeleteSuccess={fetchAgendamentos}
                onUpdateSuccess={fetchAgendamentos}
            />
        </div>
    )
}
