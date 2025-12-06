import { SalaStatus } from '@/lib/actions/recepcao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Stethoscope, Box } from 'lucide-react'

export default function StatusSalas({ salas }: { salas: SalaStatus[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {salas.map(sala => (
                <Card key={sala.id} className={`relative overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-shadow ${sala.status === 'ocupada' ? 'border-l-red-500 bg-red-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
                    {/* Photo Background */}
                    {sala.foto_url && (
                        <div className="absolute inset-0 opacity-60 pointer-events-none">
                            <img
                                src={sala.foto_url}
                                alt={sala.nome}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent dark:from-gray-800/95 dark:via-gray-800/70" />
                        </div>
                    )}

                    <div className="relative z-10">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden relative"
                                        style={{ backgroundColor: sala.cor_identificacao }}
                                    >
                                        {sala.foto_url ? (
                                            <img
                                                src={sala.foto_url}
                                                alt={sala.nome}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Box className="w-5 h-5" />
                                        )}
                                    </div>
                                    <CardTitle className="text-lg font-bold text-gray-800">{sala.nome}</CardTitle>
                                </div>
                                <Badge variant={sala.status === 'ocupada' ? 'destructive' : 'default'} className={sala.status === 'livre' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                    {sala.status === 'ocupada' ? 'Ocupada' : 'Livre'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {sala.status === 'ocupada' && sala.ocupante_atual ? (
                                <div className="space-y-3 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium bg-white/60 p-1 rounded-md backdrop-blur-sm">
                                        <Stethoscope className="w-4 h-4 text-blue-500" />
                                        <span>{sala.ocupante_atual.terapeuta}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium bg-white/60 p-1 rounded-md backdrop-blur-sm">
                                        <User className="w-4 h-4 text-purple-500" />
                                        <span>{sala.ocupante_atual.paciente}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/80 p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {new Date(sala.ocupante_atual.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(sala.ocupante_atual.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-gray-500 text-sm italic bg-white/30 rounded-lg backdrop-blur-sm">
                                    Disponível para uso
                                </div>
                            )}
                        </CardContent>
                    </div>
                </Card>
            ))}
            {salas.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                    Nenhuma sala cadastrada.
                </div>
            )}
        </div>
    )
}
