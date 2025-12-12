import ClinicLayoutWrapper from './ClinicLayoutWrapper'
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
        <ClinicLayoutWrapper clinica={clinica}>
            {children}
        </ClinicLayoutWrapper>
    )
}
