import { getPaciente, getResponsaveis, getAnamnese } from '@/lib/actions/pacientes'
import { getTerapeutas } from '@/lib/actions/terapeutas'
import { getRelatoriosByPaciente } from '@/lib/actions/relatorios'
import { getPlanosIAByPaciente } from '@/lib/actions/ai_generation'
import { getClinica } from '@/lib/actions/clinica'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PacienteDetailsTabs from '@/components/PacienteDetailsTabs'
import Image from 'next/image'
import { CuteUsers } from '@/components/icons/CuteIcons'
import GerarPlanoModal from '@/components/AI/GerarPlanoModal'

export default async function PacienteDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const pacienteId = parseInt(id)
    const supabase = await createClient()

    const [paciente, responsaveis, anamnese, terapeutasData, relatorios, planosIA, clinic] = await Promise.all([
        getPaciente(pacienteId),
        getResponsaveis(pacienteId),
        getAnamnese(pacienteId),
        getTerapeutas().catch(() => ({ terapeutas: [] })), // Handle error if user not allowed
        getRelatoriosByPaciente(pacienteId),
        getPlanosIAByPaciente(pacienteId),
        getClinica()
    ])

    if (!paciente) {
        notFound()
    }

    // Fetch linked therapists
    const { data: linkedTerapeutas } = await supabase
        .from('pacientes_terapeutas')
        .select('terapeuta_id')
        .eq('paciente_id', pacienteId)

    const linkedTerapeutaIds = linkedTerapeutas?.map((t: any) => t.terapeuta_id) || []

    // Check user profile for permissions
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('tipo_perfil')
        .eq('id', user?.id)
        .single()

    const canGenerateAI = userProfile?.tipo_perfil !== 'recepcao'

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
                {canGenerateAI && (
                    <div className="absolute top-4 right-4 md:top-8 md:right-8">
                        <GerarPlanoModal pacienteId={pacienteId} />
                    </div>
                )}

                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50">
                    {paciente.foto_url ? (
                        <Image
                            src={paciente.foto_url}
                            alt={paciente.nome}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-4xl">
                            {paciente.nome.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            {paciente.nome}
                        </h1>
                        <CuteUsers className="w-8 h-8 text-primary animate-bounce" />
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-gray-600 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            🎂 {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                        </span>
                        {paciente.ativo ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                Ativo
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                Inativo
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <PacienteDetailsTabs
                paciente={paciente}
                responsaveis={responsaveis}
                anamnese={anamnese}
                allTerapeutas={terapeutasData.terapeutas}
                linkedTerapeutaIds={linkedTerapeutaIds}
                relatorios={relatorios || []}
                planosIA={planosIA || []}
                clinicLogo={clinic?.logo_url}
                clinicName={clinic?.nome_fantasia || clinic?.razao_social}
            />
        </div>
    )
}
