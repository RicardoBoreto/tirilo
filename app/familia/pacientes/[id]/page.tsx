import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSessoesLudicas } from '@/lib/actions/ludoterapia'
import { getAgendaPaciente } from '@/lib/actions/familia'
import LudoterapiaTab from '@/components/LudoterapiaTab'
import AgendaTab from '@/components/AgendaTab'

export default async function FamilyPacientePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const pacienteId = parseInt(id)
    const supabase = await createClient()
    const adminDb = await createAdminClient()

    // 1. Get Logged User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Get Responsavel ID
    const { data: responsavel } = await adminDb
        .from('responsaveis')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!responsavel) redirect('/login')

    // 3. Verify Link
    const { data: link } = await adminDb
        .from('pacientes_responsaveis')
        .select('id')
        .eq('paciente_id', pacienteId)
        .eq('responsavel_id', responsavel.id)
        .single()

    if (!link) notFound()

    // 4. Fetch Data
    const { data: paciente } = await adminDb
        .from('pacientes')
        .select(`
            *,
            anamnese:pacientes_anamnese(*),
            clinica:saas_clinicas(*)
        `)
        .eq('id', pacienteId)
        .single()

    if (!paciente) notFound()

    // Fetch Therapists
    const { data: terapeutas } = await adminDb
        .from('pacientes_terapeutas')
        .select(`
            terapeuta:usuarios!terapeuta_id (
                id,
                nome_completo,
                foto_url,
                celular_whatsapp
            )
        `)
        .eq('paciente_id', pacienteId)

    // Fetch Ludic Sessions
    const sessoesLudicas = await getSessoesLudicas(pacienteId)

    // Fetch Agenda
    const agenda = await getAgendaPaciente(pacienteId)

    return (
        <div className="space-y-6">
            <Link
                href="/familia"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Meus Filhos
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900 shadow-lg">
                    {paciente.foto_url ? (
                        <Image
                            src={paciente.foto_url}
                            alt={paciente.nome}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900 text-blue-500 dark:text-blue-300 font-bold text-4xl">
                            {paciente.nome.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {paciente.nome}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            🎂 {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            🏥 {paciente.clinica?.nome_fantasia}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="agenda" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto flex-nowrap">
                    <TabsTrigger value="agenda" className="flex-1 min-w-[150px] py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 gap-2">
                        <span>📅</span> Agenda
                    </TabsTrigger>
                    <TabsTrigger value="ludoterapia" className="flex-1 min-w-[150px] py-3 rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/20 dark:data-[state=active]:text-purple-300 gap-2">
                        <span>🤖</span> Aventuras com Tirilo
                    </TabsTrigger>
                    <TabsTrigger value="anamnese" className="flex-1 min-w-[120px] py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300">
                        Histórico
                    </TabsTrigger>
                    <TabsTrigger value="terapeutas" className="flex-1 min-w-[120px] py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300">
                        Equipe
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agenda">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <AgendaTab agendamentos={agenda} />
                    </div>
                </TabsContent>

                <TabsContent value="ludoterapia">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <LudoterapiaTab sessoes={sessoesLudicas} />
                    </div>
                </TabsContent>

                <TabsContent value="anamnese">
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="grid gap-6">
                            {/* Development Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">👶</span>
                                    Desenvolvimento
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gestação</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.gestacao_intercorrencias || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Parto</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.parto_tipo || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Desenvolvimento Motor</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.desenvolvimento_motor || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Linguagem</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.desenvolvimento_linguagem || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Medical History */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">🏥</span>
                                    Histórico Médico
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Histórico</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.historico_medico || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Medicamentos</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.medicamentos_atuais || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Alergias</label>
                                        <p className="mt-1 text-gray-900 dark:text-white">{paciente.anamnese?.alergias || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="terapeutas">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {terapeutas?.map((item: any) => (
                            <div key={item.terapeuta.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {item.terapeuta.foto_url ? (
                                        <Image
                                            src={item.terapeuta.foto_url}
                                            alt={item.terapeuta.nome_completo}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-gray-500 font-bold text-lg">
                                            {item.terapeuta.nome_completo.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {item.terapeuta.nome_completo}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Terapeuta
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!terapeutas || terapeutas.length === 0) && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                Nenhuma terapeuta vinculada.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
