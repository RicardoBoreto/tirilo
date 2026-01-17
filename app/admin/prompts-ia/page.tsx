import { getPrompts, deletePrompt, togglePromptStatus } from '@/lib/actions/ai_prompts'
import { clonePrompt } from '@/lib/actions/ai_prompts_clone'
import PromptForm from '@/components/AI/PromptForm'
import PromptFilter from '@/components/AI/PromptFilter'
import DeletePromptButton from '@/components/AI/DeletePromptButton'
import { getTerapeutas } from '@/lib/actions/terapeutas'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Power, Sparkles, Copy, Eye } from 'lucide-react'
import { revalidatePath } from 'next/cache'

// @ts-ignore
export default async function PromptsIAPageV2(props: { searchParams: any }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: userProfile } = await supabase.from('usuarios').select('tipo_perfil').eq('id', user?.id).single()
    const isAdmin = userProfile?.tipo_perfil !== 'terapeuta'

    const terapeutaId = searchParams?.terapeuta
    const prompts = await getPrompts(terapeutaId)

    let terapeutas: any[] = []
    if (isAdmin) {
        try {
            const result = await getTerapeutas()
            terapeutas = result.terapeutas

            // Adicionar Admin atual na lista para filtro
            if (user && !terapeutas.find((t: any) => t.id === user.id)) {
                terapeutas.unshift({
                    id: user.id,
                    nome_completo: 'Meus Prompts (Admin/Templates)',
                    nome: 'Meus Prompts (Admin/Templates)'
                })
            }
        } catch (e) {
            console.error('Erro ao buscar terapeutas:', e)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        Assistente IA - Meus Prompts
                    </h1>
                    <p className="text-gray-500 mt-2">Personalize como a IA deve atuar na sua clínica.</p>
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && <PromptFilter terapeutas={terapeutas} />}
                    <PromptForm terapeutas={terapeutas} isAdmin={isAdmin} currentUserId={user?.id} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map(prompt => {
                    const isOwner = prompt.terapeuta_id === user?.id
                    const canEdit = isAdmin || isOwner

                    return (
                        <Card key={prompt.id} className="rounded-3xl border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <CardHeader className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant={prompt.ativo ? 'default' : 'secondary'} className={prompt.ativo ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {prompt.ativo ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={`font-mono text-xs ${prompt.categoria === 'plano' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {prompt.categoria === 'plano' ? 'Plano' : 'Relatório'}
                                        </Badge>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {prompt.modelo_gemini}
                                        </Badge>
                                    </div>
                                </div>
                                <CardTitle className="mt-2 text-xl">{prompt.nome_prompt}</CardTitle>
                                <CardDescription className="line-clamp-2">{prompt.descricao}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 h-32 overflow-hidden relative">
                                    {prompt.prompt_texto}
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 to-transparent" />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                    <PromptForm
                                        initialData={prompt}
                                        terapeutas={terapeutas}
                                        isAdmin={isAdmin}
                                        currentUserId={user?.id}
                                        trigger={
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Clonar Prompt">
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        }
                                    />

                                    {canEdit && (
                                        <form action={async () => {
                                            'use server'
                                            await togglePromptStatus(prompt.id, prompt.ativo)
                                        }}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-900" title={prompt.ativo ? "Desativar" : "Ativar"}>
                                                <Power className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    )}

                                    <PromptForm
                                        promptToEdit={prompt}
                                        terapeutas={terapeutas}
                                        isAdmin={isAdmin}
                                        readOnly={!canEdit}
                                        currentUserId={user?.id}
                                        trigger={
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title={canEdit ? "Editar" : "Visualizar"}>
                                                {canEdit ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        }
                                    />

                                    {canEdit && <DeletePromptButton promptId={prompt.id} />}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
