import { getMeusFilhos } from '@/lib/actions/familia'
import Link from 'next/link'
import Image from 'next/image'
import { CuteStar, CuteUsers } from '@/components/icons/CuteIcons'
import { Card, CardContent } from '@/components/ui/card'

export default async function FamiliaDashboard() {
    const filhos = await getMeusFilhos()

    return (
        <div className="space-y-8">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Meus Filhos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Acompanhe o desenvolvimento e informações dos seus filhos.
                </p>
            </div>

            {filhos.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 border-dashed border-2 border-gray-200 dark:border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <CuteUsers className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            Nenhum paciente vinculado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Você ainda não tem pacientes vinculados ao seu perfil. Entre em contato com a clínica para solicitar o acesso.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filhos.map((filho: any) => (
                        <Link key={filho.id} href={`/familia/pacientes/${filho.id}`} className="group">
                            <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 group-hover:-translate-y-1">
                                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                                    {filho.foto_url ? (
                                        <Image
                                            src={filho.foto_url}
                                            alt={filho.nome}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl font-bold text-primary/20">
                                                {filho.nome.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                                            <CuteStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                        {filho.nome}
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span>🎂</span>
                                            <span>
                                                {new Date(filho.data_nascimento).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>🏥</span>
                                            <span>{filho.clinica?.nome_fantasia || 'Clínica'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
