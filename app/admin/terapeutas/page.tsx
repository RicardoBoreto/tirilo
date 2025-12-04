import { getTerapeutas } from '@/lib/actions/terapeutas'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CuteStethoscope } from '@/components/icons/CuteIcons'
import { Plus } from 'lucide-react'

export default async function TerapeutasPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch current user profile
    const { data: currentUser } = await supabase
        .from('usuarios')
        .select('tipo_perfil, id')
        .eq('id', user?.id)
        .single()

    const isTerapeuta = currentUser?.tipo_perfil === 'terapeuta'

    // This will throw if not authenticated or no clinic, handled by error boundary or redirect
    let data
    try {
        data = await getTerapeutas()
    } catch (error) {
        // Fallback for super admin or error
        console.error(error)
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600">Erro ao carregar terapeutas</h1>
                <p>Verifique se você está logado e vinculado a uma clínica.</p>
            </div>
        )
    }

    const { terapeutas, max_terapeutas, total_terapeutas } = data
    const limitReached = total_terapeutas >= max_terapeutas

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CuteStethoscope className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                            Terapeutas
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground ml-1">
                        Gerencie a equipe de terapeutas da sua clínica
                    </p>
                </div>

                {!isTerapeuta && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Licenças:</span>
                            <span className={`font-bold text-lg ${limitReached ? 'text-red-600' : 'text-green-600'}`}>
                                {total_terapeutas}
                            </span>
                            <span className="text-gray-300">/</span>
                            <span className="font-medium text-gray-900 dark:text-white">{max_terapeutas}</span>
                        </div>

                        {limitReached ? (
                            <Button disabled size="lg" className="w-full md:w-auto rounded-2xl opacity-50 cursor-not-allowed">
                                <Plus className="w-5 h-5 mr-2" />
                                Novo Terapeuta
                            </Button>
                        ) : (
                            <Link href="/admin/terapeutas/novo" className="w-full md:w-auto">
                                <Button size="lg" className="w-full rounded-2xl shadow-lg shadow-primary/20">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Novo Terapeuta
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {terapeutas.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <div className="flex flex-col items-center gap-4">
                        <CuteStethoscope className="w-20 h-20 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Nenhum terapeuta cadastrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Comece montando sua equipe de especialistas.
                        </p>
                        {!limitReached && !isTerapeuta && (
                            <Link href="/admin/terapeutas/novo">
                                <Button className="mt-4">
                                    Cadastrar Primeiro Terapeuta
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Terapeuta
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Registro
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Especialidades
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contato
                                    </th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {terapeutas.map((terapeuta: any) => (
                                    <tr key={terapeuta.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 flex-shrink-0 relative">
                                                    {terapeuta.foto_url ? (
                                                        <Image
                                                            className="rounded-full object-cover border-2 border-white shadow-sm"
                                                            src={terapeuta.foto_url}
                                                            alt={terapeuta.nome_completo}
                                                            fill
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-300 font-bold text-lg border border-gray-200">
                                                            {terapeuta.nome_completo.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-base font-bold text-gray-900 dark:text-white">
                                                        {terapeuta.nome_completo}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {terapeuta.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                            {terapeuta.terapeutas_curriculo?.[0]?.registro_profissional || '-'}
                                        </td>
                                        <td className="px-8 py-5 text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                {terapeuta.terapeutas_curriculo?.[0]?.especialidades?.map((esp: string, idx: number) => (
                                                    <span key={idx} className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        {esp}
                                                    </span>
                                                )) || <span className="text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-600 dark:text-gray-400">
                                            {terapeuta.celular_whatsapp || '-'}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/terapeutas/${terapeuta.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                                        Ver
                                                    </Button>
                                                </Link>
                                                {(!isTerapeuta || terapeuta.id === currentUser?.id) && (
                                                    <Link href={`/admin/terapeutas/${terapeuta.id}/editar`}>
                                                        <Button size="sm" variant="outline" className="h-8 rounded-xl border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700">
                                                            Editar
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {terapeutas.map((terapeuta: any) => (
                            <Card key={terapeuta.id} className="overflow-hidden border-none shadow-md">
                                <CardContent className="p-6 flex flex-col items-center gap-4">
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                                        {terapeuta.foto_url ? (
                                            <Image
                                                className="object-cover"
                                                src={terapeuta.foto_url}
                                                alt={terapeuta.nome_completo}
                                                fill
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-300 font-bold text-4xl">
                                                {terapeuta.nome_completo.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center w-full">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {terapeuta.nome_completo}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            {terapeuta.email}
                                        </p>
                                        {terapeuta.terapeutas_curriculo?.[0]?.registro_profissional && (
                                            <p className="text-sm font-mono text-gray-600 dark:text-gray-300 mb-2 bg-gray-50 inline-block px-2 py-1 rounded">
                                                Reg: {terapeuta.terapeutas_curriculo[0].registro_profissional}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                                            {terapeuta.terapeutas_curriculo?.[0]?.especialidades?.map((esp: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {esp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                        <Link href={`/admin/terapeutas/${terapeuta.id}`} className="w-full">
                                            <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                                                Ver Detalhes
                                            </Button>
                                        </Link>
                                        {(!isTerapeuta || terapeuta.id === currentUser?.id) && (
                                            <Link href={`/admin/terapeutas/${terapeuta.id}/editar`} className="w-full">
                                                <Button variant="outline" className="w-full border-green-200 text-green-600 hover:bg-green-50">
                                                    Editar
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
