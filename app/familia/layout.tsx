import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CuteRobot } from '@/components/icons/CuteIcons'
import { LogOut } from 'lucide-react'


export default async function FamilyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify if user is a Responsavel
    const { data: responsavel } = await supabase
        .from('responsaveis')
        .select('id, nome')
        .eq('user_id', user.id)
        .single()

    if (!responsavel) {
        // If not a responsible, maybe they are an admin trying to access?
        // For now, redirect to admin if they are not a responsible
        redirect('/admin/clinicas')
    }

    return (
        <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
            {/* Simple Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/familia" className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <CuteRobot className="w-8 h-8 text-primary" />
                        </div>
                        <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                            Portal da Família
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline-block">
                            Olá, <strong>{responsavel.nome.split(' ')[0]}</strong>
                        </span>
                        <form action={async () => {
                            'use server'
                            const supabase = await createClient()
                            await supabase.auth.signOut()
                            redirect('/login')
                        }}>
                            <button type="submit" className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Sair">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
