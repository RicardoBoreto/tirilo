
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingBag, Check, Play, Gamepad2 } from "lucide-react"
import { adquirirJogo } from '@/lib/actions/ludoterapia'
import { useToast } from "@/components/ui/use-toast"

interface Props {
    clinicaId: number
    jogos: any[]
}

export default function ShopClient({ clinicaId, jogos }: Props) {
    const [loadingIds, setLoadingIds] = useState<string[]>([])
    const { toast } = useToast()

    async function handleComprar(jogoId: string, nomeJogo: string) {
        if (!confirm(`Deseja adicionar "${nomeJogo}" à sua biblioteca?`)) return

        setLoadingIds(prev => [...prev, jogoId])

        try {
            const result = await adquirirJogo(clinicaId, jogoId)
            if (result.error) {
                toast({
                    title: "Erro ao adquirir",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Sucesso!",
                    description: `"${nomeJogo}" adicionado com sucesso!`,
                    className: "bg-green-600 text-white border-green-700"
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Erro inesperado",
                variant: "destructive"
            })
        } finally {
            setLoadingIds(prev => prev.filter(id => id !== jogoId))
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jogos.map(jogo => (
                <Card key={jogo.id} className={`flex flex-col overflow-hidden transition-all hover:shadow-md ${jogo.adquirido ? 'border-green-200 dark:border-green-900 bg-green-50/10' : ''}`}>
                    {/* Placeholder de Imagem */}
                    <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center relative">
                        {jogo.imagem_url ? (
                            <img src={jogo.imagem_url} alt={jogo.nome} className="w-full h-full object-cover" />
                        ) : (
                            <Gamepad2 className="w-16 h-16 text-blue-300 dark:text-blue-700 opacity-50" />
                        )}
                        {jogo.adquirido && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Check className="w-3 h-3" />
                                INSTALADO
                            </div>
                        )}
                        {jogo.preco > 0 && !jogo.adquirido && (
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                R$ {jogo.preco}
                            </div>
                        )}
                        {jogo.preco === 0 && !jogo.adquirido && (
                            <div className="absolute bottom-2 right-2 bg-green-600/90 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                GRATUITO
                            </div>
                        )}
                    </div>

                    <CardHeader>
                        <CardTitle className="flex justify-between items-start gap-2">
                            <span className="truncate" title={jogo.nome}>{jogo.nome}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[40px]">
                            {jogo.descricao || 'Sem descrição disponível.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {jogo.habilidades_nomes.map((h: string) => (
                                <Badge key={h} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-900">
                                    {h}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                        {jogo.adquirido ? (
                            <Button className="w-full h-10" variant="secondary" disabled>
                                <Check className="mr-2 w-4 h-4" />
                                Já na Biblioteca
                            </Button>
                        ) : (
                            <Button
                                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleComprar(jogo.id, jogo.nome)}
                                disabled={loadingIds.includes(jogo.id)}
                            >
                                {loadingIds.includes(jogo.id) ? (
                                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                ) : (
                                    <ShoppingBag className="mr-2 w-4 h-4" />
                                )}
                                {jogo.preco > 0 ? 'Adquirir Licença' : 'Instalar Grátis'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
