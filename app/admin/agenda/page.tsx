import { getAgendamentos } from '@/lib/actions/agenda'
import { getCurrentUserProfile } from '@/lib/actions/equipe'
import AgendaCalendar from '@/components/Agenda/AgendaCalendar'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export default async function AgendaPage() {
    // Fetch profile and clinic
    const userProfile = await getCurrentUserProfile()

    // Default to current week
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }) // Sunday

    const agendamentos = await getAgendamentos(
        format(start, 'yyyy-MM-dd HH:mm:ss'),
        format(end, 'yyyy-MM-dd HH:mm:ss')
    )

    return (
        <div className="h-full">
            <AgendaCalendar
                agendamentos={agendamentos}
                userProfile={userProfile}
            />
        </div>
    )
}
