import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CuteRobot } from '@/components/icons/CuteIcons'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'


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

    const adminDb = await createAdminClient()
    const { data: firstLink } = await adminDb
        .from('pacientes_responsaveis')
        .select(`
            paciente:pacientes (
                clinica:saas_clinicas (
                    nome_fantasia,
                    logo_url
                )
            )
        `)
        .eq('responsavel_id', responsavel.id)
        .limit(1)
        .single()

    const linkData = firstLink as any
    const pacienteData = Array.isArray(linkData?.paciente) ? linkData.paciente[0] : linkData?.paciente
    const clinicaData = Array.isArray(pacienteData?.clinica) ? pacienteData.clinica[0] : pacienteData?.clinica
    const clinica = clinicaData

    return (
        <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
            {/* Simple Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/familia" className="flex items-center gap-3">
                        {clinica?.logo_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                                <Image
                                    src={clinica.logo_url}
                                    alt={clinica.nome_fantasia || 'Logo'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-primary/10 p-2 rounded-full">
                                <CuteRobot className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-heading font-bold text-lg text-gray-900 dark:text-white leading-tight">
                                {clinica?.nome_fantasia || 'Portal da Família'}
                            </span>
                            {clinica?.nome_fantasia && (
                                <span className="text-xs text-gray-500 font-medium">Portal da Família - Tirilo</span>
                            )}
                        </div>
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
                            <Button
                                type="submit"
                                variant="destructive"
                                className="rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-none shadow-none"
                            >
                                <span className="hidden lg:inline mr-2">Sair</span>
                                <LogOut className="w-5 h-5" />
                            </Button>
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
