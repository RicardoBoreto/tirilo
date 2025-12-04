import { getAgendamentos } from '@/lib/actions/agenda'
import AgendaCalendar from '@/components/Agenda/AgendaCalendar'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export default async function AgendaPage() {
    // Default to current week
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }) // Sunday

    // We might need to fetch a broader range or handle pagination in client.
    // For simplicity, let's fetch current month or a few weeks around now.
    // Ideally, the client component should request data based on view, but for server component initial load:
    const agendamentos = await getAgendamentos(
        format(start, 'yyyy-MM-dd HH:mm:ss'),
        format(end, 'yyyy-MM-dd HH:mm:ss')
    )

    // Actually, fetching just one week might be limiting if user navigates.
    // A better approach for a real app is client-side fetching or server actions on navigation.
    // For this MVP, let's fetch a wider range (e.g. +- 1 month) to allow some navigation without refetching immediately,
    // or just pass the initial data and let the client handle it (though client navigation won't update server data without action).
    // Let's stick to initial load and maybe add a refresh button or use server params for navigation later.
    // For now, let's fetch 3 months to be safe? No, that's too much data maybe.
    // Let's fetch current week. The navigation in Calendar won't update data unless we use URL params.

    // REVISION: To make navigation work with Server Components, we should use searchParams.
    // But the requirements asked for a "Calendar" component.
    // Let's fetch a generous range for now (e.g. current month) or just accept that this is a simple version.
    // Or better: The `getAgendamentos` is a server action, we can call it from client!
    // So let's pass initial data and let the client component fetch more if needed?
    // Actually, `AgendaCalendar` is a client component. It can call `getAgendamentos`.
    // But `getAgendamentos` is defined as 'use server'.

    // Let's refactor: Page fetches initial data. Calendar manages state.
    // But wait, if I navigate next week in client, I need new data.
    // I will modify `AgendaCalendar` to fetch data when date changes.
    // For the page, I'll just pass empty or initial.

    // Let's fetch all future appointments for simplicity? No.
    // Let's fetch current week here.

    return (
        <div className="h-full">
            <AgendaCalendar agendamentos={agendamentos} />
        </div>
    )
}
