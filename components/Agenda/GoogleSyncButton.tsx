'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export default function GoogleSyncButton() {
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()

    const supabase = createClient()

    useEffect(() => {
        checkConnection()
    }, [])

    useEffect(() => {
        if (searchParams.get('success') === 'google_connected') {
            toast({
                title: "Google Agenda Conectado!",
                description: "Seus agendamentos serão sincronizados.",
                variant: "default",
                className: "bg-green-500 text-white"
            })
            // Clean URL
            router.replace('/admin/agenda')
            setIsConnected(true)
        }
        if (searchParams.get('error') === 'google_auth_error') {
            toast({
                title: "Erro na conexão",
                description: "Não foi possível conectar ao Google Agenda.",
                variant: "destructive"
            })
        }
    }, [searchParams])

    async function checkConnection() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('saas_integracoes_google')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setIsConnected(true)
            }
        } catch (error) {
            console.error('Erro ao verificar conexão Google:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = () => {
        window.location.href = '/api/auth/google'
    }

    if (loading) return null

    return (
        <Button
            variant={isConnected ? "outline" : "secondary"}
            size="sm"
            onClick={isConnected ? () => { } : handleConnect}
            className={`gap-2 ${isConnected ? 'text-green-600 border-green-200 bg-green-50' : ''}`}
            disabled={isConnected}
        >
            <Calendar className="w-4 h-4" />
            {isConnected ? 'Sincronizado' : 'Sincronizar Google'}
        </Button>
    )
}
