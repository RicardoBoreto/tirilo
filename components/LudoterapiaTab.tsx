'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Gamepad2, Timer, Trophy, Activity, MessageSquare, Brain } from 'lucide-react'
import { getSessaoDetalhes } from '@/lib/actions/ludoterapia'

interface LudoterapiaTabProps {
    sessoes: any[]
}

export default function LudoterapiaTab({ sessoes }: LudoterapiaTabProps) {
    const [selectedSessaoId, setSelectedSessaoId] = useState<string | null>(null)
    const [sessaoDetalhes, setSessaoDetalhes] = useState<any>(null)
    const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false)

    async function handleOpenSessao(sessaoId: string) {
        setSelectedSessaoId(sessaoId)
        setIsLoadingDetalhes(true)
        const data = await getSessaoDetalhes(sessaoId)
        setSessaoDetalhes(data)
        setIsLoadingDetalhes(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Histórico de Ludoterapia
                    </h2>
                    <p className="text-sm text-gray-500">
                        Acompanhe o desempenho e interações do paciente nas sessões com o robô.
                    </p>
                </div>
            </div>

            {sessoes.length === 0 ? (
                <Card className="bg-gray-50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Gamepad2 className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma sessão registrada</h3>
                        <p className="text-gray-500 max-w-sm mt-1">
                            Este paciente ainda não realizou sessões lúdicas com o Robô Tirilo.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {sessoes.map((sessao) => (
                        <Card key={sessao.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => handleOpenSessao(sessao.id)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                        <Gamepad2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {sessao.jogo?.nome || 'Jogo Desconhecido'}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>
                                                {format(new Date(sessao.data_inicio), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                            </span>
                                            <span>•</span>
                                            <span>{sessao.nivel_dificuldade}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {sessao.pontuacao_final != null && (
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs text-gray-500 uppercase">Pontos</div>
                                            <div className="font-bold text-lg text-primary">{sessao.pontuacao_final}</div>
                                        </div>
                                    )}
                                    <Badge variant={sessao.status === 'CONCLUIDO' ? 'default' : 'secondary'}>
                                        {sessao.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selectedSessaoId} onOpenChange={(open) => !open && setSelectedSessaoId(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Sessão</DialogTitle>
                        <DialogDescription>
                            {sessaoDetalhes?.sessao ?
                                `${sessaoDetalhes.sessao.jogo?.nome} - ${format(new Date(sessaoDetalhes.sessao.data_inicio), "PPP 'às' p", { locale: ptBR })}`
                                : 'Carregando...'}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetalhes || !sessaoDetalhes ? (
                        <div className="flex justify-center py-12">
                            <Activity className="w-8 h-8 animate-pulse text-gray-300" />
                        </div>
                    ) : (
                        <Tabs defaultValue="resumo" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="resumo">Resumo & Métricas</TabsTrigger>
                                <TabsTrigger value="diario">Diário de Bordo</TabsTrigger>
                            </TabsList>

                            <TabsContent value="resumo" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Duração</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                <Timer className="w-5 h-5 text-blue-500" />
                                                {sessaoDetalhes.sessao.duracao_segundos ? `${Math.floor(sessaoDetalhes.sessao.duracao_segundos / 60)}m` : '-'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Pontuação</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                                {sessaoDetalhes.sessao.pontuacao_final}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Dificuldade</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                <Brain className="w-5 h-5 text-purple-500" />
                                                {sessaoDetalhes.sessao.nivel_dificuldade}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {sessaoDetalhes.sessao.metricas && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Métricas Detalhadas</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
                                                {JSON.stringify(sessaoDetalhes.sessao.metricas, null, 2)}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="diario" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Transcrição da Sessão
                                        </CardTitle>
                                        <CardDescription>
                                            Registro automático de diálogos capturados pelo robô.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px] w-full pr-4">
                                            {sessaoDetalhes.diario.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">Nenhum registro de áudio para esta sessão.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {sessaoDetalhes.diario.map((log: any) => (
                                                        <div key={log.id} className={`flex flex-col ${log.tipo_evento === 'FALA_ROBO' ? 'items-end' : 'items-start'
                                                            }`}>
                                                            <div className={`
                                                                max-w-[80%] rounded-lg p-3 text-sm
                                                                ${log.tipo_evento === 'FALA_ROBO'
                                                                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 rounded-tr-none'
                                                                    : (log.tipo_evento === 'FALA_TERAPEUTA'
                                                                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100 rounded-tl-none'
                                                                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none')
                                                                }
                                                            `}>
                                                                <span className="text-xs font-bold opacity-70 block mb-1">
                                                                    {log.tipo_evento === 'FALA_ROBO' ? 'Robô' : (log.tipo_evento === 'FALA_TERAPEUTA' ? 'Terapeuta' : 'Paciente/Outro')}
                                                                </span>
                                                                {log.texto_transcrito}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                                {format(new Date(log.timestamp), "HH:mm:ss")}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
