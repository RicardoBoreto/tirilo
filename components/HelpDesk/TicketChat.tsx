'use client'

import { useState, useRef, useEffect } from 'react'
import { sendMessage, updateTicketStatus, getAnexoSignedUrl, type Ticket, type Mensagem } from '@/lib/actions/help-desk'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, CheckCircle, XCircle, Clock, User, Shield, AlertCircle, Paperclip, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
    ticket: Ticket
    mensagens: Mensagem[]
    currentUserId: string
}

function AnexoPreview({ anexoUrl, anexoNome, anexoTipo, isMe }: {
    anexoUrl: string
    anexoNome: string | null
    anexoTipo: string | null
    isMe: boolean
}) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadUrl() {
            const url = await getAnexoSignedUrl(anexoUrl)
            setSignedUrl(url)
            setLoading(false)
        }
        loadUrl()
    }, [anexoUrl])

    const isImage = anexoTipo?.startsWith('image/')

    if (loading) {
        return (
            <div className="mt-2 pt-2 border-t border-gray-200/50">
                <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando anexo...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`mt-2 ${isImage ? '' : 'pt-2 border-t border-gray-200/50'}`}>
            {isImage && signedUrl ? (
                <div className="space-y-2">
                    <img
                        src={signedUrl}
                        alt={anexoNome || 'Imagem anexada'}
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(signedUrl, '_blank')}
                    />
                    <button
                        onClick={() => window.open(signedUrl, '_blank')}
                        className={`flex items-center gap-2 text-xs hover:underline ${isMe ? 'text-primary-foreground/80' : 'text-gray-600'}`}
                    >
                        <Download className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{anexoNome}</span>
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => signedUrl && window.open(signedUrl, '_blank')}
                    className="flex items-center gap-2 text-xs hover:underline"
                    disabled={!signedUrl}
                >
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{anexoNome}</span>
                    <Download className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}

export default function TicketChat({ ticket, mensagens, currentUserId }: Props) {
    const router = useRouter()
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [mensagens])

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim() && !selectedFile) return

        setSending(true)
        try {
            const formData = new FormData()
            formData.append('ticketId', ticket.id.toString())
            formData.append('mensagem', newMessage)
            if (selectedFile) {
                formData.append('arquivo', selectedFile)
            }

            const result = await sendMessage(formData)
            if (result.error) throw new Error(result.error)

            setNewMessage('')
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao enviar mensagem')
        } finally {
            setSending(false)
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!confirm('Tem certeza que deseja alterar o status deste chamado?')) return
        try {
            await updateTicketStatus(ticket.id, newStatus)
            router.refresh()
        } catch (error) {
            alert('Erro ao atualizar status')
        }
    }

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-12rem)]">
            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
                    {mensagens.map((msg) => {
                        const isMe = msg.id_usuario === currentUserId
                        const isAdmin = msg.usuario?.tipo_perfil !== 'terapeuta' && !msg.usuario?.tipo_perfil // Assuming master admin has no profile type or specific check

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-xs font-medium text-gray-500">
                                        {msg.usuario?.nome || 'Suporte'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(msg.created_at).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-600'
                                        }`}
                                >
                                    {msg.mensagem && <p className="whitespace-pre-wrap">{msg.mensagem}</p>}
                                    {msg.anexo_url && (
                                        <AnexoPreview
                                            anexoUrl={msg.anexo_url}
                                            anexoNome={msg.anexo_nome}
                                            anexoTipo={msg.anexo_tipo}
                                            isMe={isMe}
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    {ticket.status === 'fechado' ? (
                        <div className="text-center text-gray-500 py-4 bg-gray-50 rounded-xl">
                            Este chamado está fechado e não aceita novas respostas.
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="space-y-3">
                            {selectedFile && (
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 truncate">{selectedFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Digite sua resposta..."
                                    className="min-h-[50px] max-h-[150px] resize-none flex-1"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend(e)
                                        }
                                    }}
                                />
                                <div className="flex flex-col gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-auto w-14 rounded-xl shrink-0"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="h-auto w-14 rounded-xl shrink-0"
                                        disabled={sending || (!newMessage.trim() && !selectedFile)}
                                    >
                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-heading font-bold text-lg mb-4">Detalhes do Chamado</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                            <div className="mt-1">
                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                    {getStatusLabel(ticket.status)}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Prioridade</label>
                            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                                {ticket.prioridade === 'alta' || ticket.prioridade === 'critica' ? (
                                    <span className="text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> Alta
                                    </span>
                                ) : (
                                    <span className="text-gray-700 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Normal
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Solicitante</label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{ticket.usuario_criador?.nome_completo}</p>
                                    <p className="text-xs text-gray-500">{ticket.usuario_criador?.email}</p>
                                </div>
                            </div>
                        </div>

                        {ticket.clinica && (
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Clínica</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium">{ticket.clinica.nome_fantasia}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        <h4 className="font-medium text-sm mb-2">Ações</h4>
                        {ticket.status !== 'resolvido' && ticket.status !== 'fechado' && (
                            <Button
                                variant="outline"
                                className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                onClick={() => handleStatusChange('resolvido')}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Resolvido
                            </Button>
                        )}
                        {ticket.status !== 'fechado' && (
                            <Button
                                variant="outline"
                                className="w-full justify-start text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                onClick={() => handleStatusChange('fechado')}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Fechar Chamado
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
