'use client'

import { SalaStatus } from '@/lib/actions/recepcao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Stethoscope } from 'lucide-react'

export default function StatusSalas({ salas }: { salas: SalaStatus[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {salas.map(sala => (
                <Card key={sala.id} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${sala.status === 'ocupada' ? 'border-l-red-500 bg-red-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold text-gray-800">{sala.nome}</CardTitle>
                            <Badge variant={sala.status === 'ocupada' ? 'destructive' : 'default'} className={sala.status === 'livre' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                {sala.status === 'ocupada' ? 'Ocupada' : 'Livre'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sala.status === 'ocupada' && sala.ocupante_atual ? (
                            <div className="space-y-3 mt-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Stethoscope className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">{sala.ocupante_atual.terapeuta}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium">{sala.ocupante_atual.paciente}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 p-2 rounded-lg border border-gray-100">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {new Date(sala.ocupante_atual.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(sala.ocupante_atual.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-24 flex items-center justify-center text-gray-400 text-sm italic">
                                Disponível para uso
                            </div>
                        )}
                    </CardContent>
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
