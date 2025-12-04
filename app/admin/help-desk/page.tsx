import { getTickets } from '@/lib/actions/help-desk'
import NewTicketModal from '@/components/HelpDesk/NewTicketModal'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LifeBuoy, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function HelpDeskPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const params = await searchParams
    const statusFilter = params.status || 'abertos' // 'abertos' | 'todos' | 'resolvidos'
    const allTickets = await getTickets()

    const tickets = allTickets.filter(t => {
        if (statusFilter === 'abertos') return t.status !== 'resolvido' && t.status !== 'fechado'
        if (statusFilter === 'resolvidos') return t.status === 'resolvido' || t.status === 'fechado'
        return true
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aberto': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'em_andamento': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'aguardando_cliente': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'resolvido': return 'bg-green-100 text-green-700 border-green-200'
            case 'fechado': return 'bg-gray-100 text-gray-700 border-gray-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'aberto': return 'Aberto'
            case 'em_andamento': return 'Em Andamento'
            case 'aguardando_cliente': return 'Aguardando Resposta'
            case 'resolvido': return 'Resolvido'
            case 'fechado': return 'Fechado'
            default: return status
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'alta':
            case 'critica':
                return <AlertCircle className="w-4 h-4 text-red-500" />
            case 'baixa':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <LifeBuoy className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            Suporte & Ajuda
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground ml-1">
                        Central de atendimento e feedback do sistema
                    </p>
                </div>
                <NewTicketModal />
            </div>

            <div className="flex gap-2">
                <Link href="/admin/help-desk?status=abertos">
                    <Button variant={statusFilter === 'abertos' ? 'default' : 'outline'} size="sm" className="rounded-xl">
                        Abertos
                    </Button>
                </Link>
                <Link href="/admin/help-desk?status=resolvidos">
                    <Button variant={statusFilter === 'resolvidos' ? 'default' : 'outline'} size="sm" className="rounded-xl">
                        Resolvidos/Fechados
                    </Button>
                </Link>
                <Link href="/admin/help-desk?status=todos">
                    <Button variant={statusFilter === 'todos' ? 'default' : 'outline'} size="sm" className="rounded-xl">
                        Todos
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum chamado encontrado</h3>
                        <p className="text-gray-500">Você ainda não abriu nenhum chamado de suporte.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/admin/help-desk/${ticket.id}`}
                            className="block bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-primary/20 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                            #{ticket.id} - {ticket.assunto}
                                        </h3>
                                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                            {getStatusLabel(ticket.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {ticket.usuario_criador && (
                                            <>
                                                <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                                    👤 {ticket.usuario_criador.nome_completo}
                                                </span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span className="flex items-center gap-1">
                                            {getPriorityIcon(ticket.prioridade)}
                                            Prioridade {ticket.prioridade.charAt(0).toUpperCase() + ticket.prioridade.slice(1)}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')} às {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        {ticket.clinica && (
                                            <>
                                                <span>•</span>
                                                <span className="font-medium text-primary">{ticket.clinica.nome_fantasia}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-gray-400 group-hover:text-primary transition-colors">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
