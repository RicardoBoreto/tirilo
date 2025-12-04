import { getClinica } from '@/lib/actions/clinica'
import ClinicaSettingsForm from '@/components/ClinicaSettingsForm'
import { CuteSettings } from '@/components/icons/CuteIcons'

export default async function ConfiguracoesPage() {
    const clinic = await getClinica()

    if (!clinic) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600">Erro</h1>
                <p>Clínica não encontrada.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <CuteSettings className="w-10 h-10 text-primary" />
                <div>
                    <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                        Configurações
                    </h1>
                    <p className="text-lg text-muted-foreground ml-1">
                        Gerencie a identidade visual e dados da sua clínica
                    </p>
                </div>
            </div>

            <ClinicaSettingsForm clinic={clinic} />
        </div>
    )
}
