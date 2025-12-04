import ClinicSidebar from '@/components/ClinicSidebar'
import { getClinica } from '@/lib/actions/clinicas'
import { notFound } from 'next/navigation'

export default async function ClinicLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const clinicaId = parseInt(id)
    const clinica = await getClinica(clinicaId)

    if (!clinica) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <ClinicSidebar clinica={clinica} />
            <main className="pl-64">
                {children}
            </main>
        </div>
    )
}
