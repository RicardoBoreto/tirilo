import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClinicasList from '@/components/ClinicasList'
import { CuteBuilding } from '@/components/icons/CuteIcons'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import BackupSection from '@/components/BackupSection'
import { redirect } from 'next/navigation'

export default async function ClinicasPage() {
    const supabase = await createClient()

    // Check if user is Super Admin (no id_clinica)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user has a clinic (if yes, they're NOT Super Admin)
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('id', user.id)
        .single()

    // If user has id_clinica, they are NOT Super Admin
    if (userProfile?.id_clinica) {
        redirect('/admin/recepcao')
    }

    const { data: clinicas, error } = await supabase
        .from('saas_clinicas')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clinicas:', error)
    }

    // Fetch all therapists to count them per clinic
    const { data: terapeutas, error: terapeutasError } = await supabase
        .from('usuarios')
        .select('id_clinica')
        .eq('tipo_perfil', 'terapeuta')

    if (terapeutasError) {
        console.error('Error fetching terapeutas:', terapeutasError)
    }

    // Calculate counts
    const terapeutasCount = (terapeutas || []).reduce((acc, curr) => {
        if (curr.id_clinica) {
            acc[curr.id_clinica] = (acc[curr.id_clinica] || 0) + 1
        }
        return acc
    }, {} as Record<number, number>)

    // Combine data
    const clinicasWithStats = (clinicas || []).map(clinica => ({
        ...clinica,
        terapeutas_cadastrados: terapeutasCount[clinica.id] || 0
    }))

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CuteBuilding className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            Clínicas
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground ml-1">
                        Gerencie todas as clínicas cadastradas no sistema
                    </p>
                </div>
                <Link href="/admin/clinicas/nova">
                    <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Clínica
                    </Button>
                </Link>
            </div>

            <BackupSection />

            <ClinicasList initialClinicas={clinicasWithStats} />
        </div>
    )
}
