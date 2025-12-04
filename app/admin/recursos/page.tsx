import { getRecursos } from '@/lib/actions/recursos'
import RecursoCard from '@/components/Recursos/RecursoCard'
import RecursoForm from '@/components/Recursos/RecursoForm'
import { Plus, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function RecursosPage() {
    const recursos = await getRecursos()

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Materiais
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie o inventário de materiais terapêuticos
                    </p>
                </div>

                <RecursoForm
                    trigger={
                        <Button className="h-12 px-6 rounded-2xl text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Recurso
                        </Button>
                    }
                />
            </div>

            {recursos.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PackageOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Nenhum recurso cadastrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        Comece cadastrando os materiais disponíveis na clínica, como jogos, instrumentos e equipamentos sensoriais.
                    </p>
                    <RecursoForm
                        trigger={
                            <Button variant="outline" className="rounded-xl">
                                Cadastrar Primeiro Recurso
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recursos.map((recurso) => (
                        <RecursoCard key={recurso.id} recurso={recurso} />
                    ))}
                </div>
            )}
        </div>
    )
}
