import { getClinica } from '@/lib/actions/clinica'
import ClinicaSettingsForm from '@/components/ClinicaSettingsForm'
import { CuteSettings } from '@/components/icons/CuteIcons'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OperadorasTab from "@/components/Configuracoes/OperadorasTab"

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
                        Gerencie a identidade visual, dados da clínica e convênios.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="clinica" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="clinica">Dados da Clínica</TabsTrigger>
                    <TabsTrigger value="convenios">Convênios e Operadoras</TabsTrigger>
                </TabsList>

                <TabsContent value="clinica">
                    <ClinicaSettingsForm clinic={clinic} />
                </TabsContent>

                <TabsContent value="convenios">
                    <OperadorasTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
