import { getPacientes } from '@/lib/actions/pacientes'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CuteUsers } from '@/components/icons/CuteIcons'
import { Plus } from 'lucide-react'
import PatientsList from '@/components/Pacientes/PatientsList'

export default async function PacientesPage() {
    const pacientes = await getPacientes()

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CuteUsers className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            Pacientes
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground ml-1">
                        Gerencie os pacientes da clínica
                    </p>
                </div>
                <Link href="/admin/pacientes/novo">
                    <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Paciente
                    </Button>
                </Link>
            </div>

            <PatientsList initialPacientes={pacientes} />
        </div>
    )
}
