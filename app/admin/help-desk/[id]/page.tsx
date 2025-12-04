import { getTicketDetails } from '@/lib/actions/help-desk'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TicketChat from '@/components/HelpDesk/TicketChat'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function TicketDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const ticketId = parseInt(id)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    const details = await getTicketDetails(ticketId)

    if (!details) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/help-desk">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                        #{details.ticket.id} - {details.ticket.assunto}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Iniciado em {new Date(details.ticket.created_at).toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>

            <TicketChat
                ticket={details.ticket}
                mensagens={details.mensagens}
                currentUserId={user.id}
            />
        </div>
    )
}
