'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Menu, LogOut, Lock } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CuteHand } from '@/components/icons/CuteIcons'

interface HeaderProps {
    user: User & {
        nome?: string
        foto_url?: string | null
    }
    clinic?: {
        logo_url: string | null
        nome_fantasia: string | null
        razao_social: string
        config_cor_primaria: string
    } | null
}

export default function Header({ user, clinic }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [sheetOpen, setSheetOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="bg-white/80 backdrop-blur-md dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 px-4 py-3 lg:px-8 lg:py-5 sticky top-0 z-40 transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-r border-gray-100 dark:border-gray-700 rounded-r-3xl">
                                <Sidebar
                                    clinic={clinic}
                                    className="w-full h-full border-none rounded-r-3xl"
                                    onLinkClick={() => setSheetOpen(false)}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:block">
                            <CuteHand className="w-6 h-6 text-accent animate-wave" />
                        </div>
                        <h2 className="text-xl font-heading font-bold text-gray-800 dark:text-white truncate max-w-[200px] lg:max-w-none">
                            {clinic?.nome_fantasia || 'Dashboard'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">
                            Olá, {user.nome?.split(' ')[0] || 'Usuário'}!
                        </p>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 capitalize">
                            {(user as any).tipo_perfil === 'recepcao' ? 'Recepção' :
                                (user as any).tipo_perfil === 'terapeuta' ? 'Terapeuta' :
                                    (user as any).tipo_perfil === 'admin' ? 'Gestor da Clínica' : 'Super Admin'}
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push('/admin/trocar-senha')}
                        variant="ghost"
                        className="rounded-2xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Trocar Senha"
                    >
                        <Lock className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-none shadow-none"
                    >
                        <span className="hidden lg:inline mr-2">Sair</span>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
