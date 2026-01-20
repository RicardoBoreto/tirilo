'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CuteRobot, CuteStar } from '@/components/icons/CuteIcons'
import { Loader2, ShieldAlert } from 'lucide-react'
import { setEnvironment, getEnvironment } from '@/lib/actions/sync'
import { useEffect } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isStaging, setIsStaging] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const isDev = process.env.NODE_ENV === 'development'

    useEffect(() => {
        async function checkEnv() {
            const env = await getEnvironment()
            setIsStaging(env === 'staging')
        }
        checkEnv()
    }, [])

    const handleEnvSwitch = async () => {
        setLoading(true)
        await setEnvironment(isStaging ? 'prod' : 'staging')
        window.location.reload()
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
            return
        }

        if (user) {
            // Check if user is admin/therapist
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('id, tipo_perfil')
                .eq('id', user.id)
                .single()

            if (usuario) {
                if (usuario.tipo_perfil === 'terapeuta') {
                    router.push('/admin/pacientes')
                } else {
                    router.push('/admin/clinicas')
                }
                router.refresh()
                return
            }

            // Check if user is family member
            const { data: responsavel } = await supabase
                .from('responsaveis')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (responsavel) {
                router.push('/familia')
                router.refresh()
                return
            }

            // Fallback
            router.push('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 opacity-20 animate-pulse">
                <CuteStar className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute bottom-10 right-10 opacity-20 animate-pulse delay-700">
                <CuteStar className="w-16 h-16 text-secondary" />
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                    <div className="text-center mb-8 flex flex-col items-center">
                        <div className="mb-4 animate-bounce">
                            {/* <CuteRobot className="w-16 h-16" color="#4F46E5" /> */}
                            <img src="/logo.svg" alt="Logo Tirilo" className="w-24 h-24 object-contain" />
                        </div>
                        <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                            SaaS Tirilo
                        </h1>
                        <p className="text-muted-foreground">
                            Faça login para acessar sua clínica
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="seu@email.com"
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="h-12"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="w-full h-12 text-lg rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                            style={{
                                background: 'linear-gradient(to right, #6366F1, rgba(99, 102, 241, 0.9))',
                                color: 'white'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>

                    {/* 
                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Não tem uma conta?{' '}
                            <a href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                Cadastre-se
                            </a>
                        </p>
                    </div>
                    */}

                    {isDev && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                            <button
                                onClick={handleEnvSwitch}
                                disabled={loading}
                                className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-2 mx-auto ${isStaging ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Ambiente: {isStaging ? 'STAGING (Clique para mudar p/ PROD)' : 'PRODUÇÃO'}
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
