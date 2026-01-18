import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function TerapeutaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: terapeuta, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .eq('tipo_perfil', 'terapeuta')
        .single()

    if (error || !terapeuta) {
        notFound()
    }

    const { data: curriculo } = await supabase
        .from('terapeutas_curriculo')
        .select('*')
        .eq('id_usuario', id)
        .maybeSingle()

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Detalhes do Terapeuta
                </h1>
                <div className="flex gap-3">
                    <Link
                        href={`/admin/terapeutas/${id}/editar`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Editar
                    </Link>
                    <Link
                        href="/admin/terapeutas"
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                        Voltar
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-start gap-6 mb-6">
                    {terapeuta.foto_url ? (
                        <Image
                            src={terapeuta.foto_url}
                            alt={terapeuta.nome_completo}
                            width={120}
                            height={120}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-30 h-30 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-4xl">
                            {terapeuta.nome_completo.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {terapeuta.nome_completo}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">{terapeuta.email}</p>
                        {terapeuta.celular_whatsapp && (
                            <p className="text-gray-600 dark:text-gray-400">
                                WhatsApp: {terapeuta.celular_whatsapp}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            CPF
                        </h3>
                        <p className="text-gray-900 dark:text-white">{terapeuta.cpf || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Registro Profissional
                        </h3>
                        <p className="text-gray-900 dark:text-white">{curriculo?.registro_profissional || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Formação
                        </h3>
                        <p className="text-gray-900 dark:text-white">{curriculo?.formacao || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Data de Cadastro
                        </h3>
                        <p className="text-gray-900 dark:text-white">
                            {new Date(terapeuta.created_at).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>

                {curriculo?.especialidades && curriculo.especialidades.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Especialidades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {curriculo.especialidades.map((esp: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    {esp}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {curriculo?.publico_alvo && curriculo.publico_alvo.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Público Alvo
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {curriculo.publico_alvo.map((pub: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                    {pub}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {curriculo?.bio && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Biografia
                        </h3>
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{curriculo.bio}</p>
                    </div>
                )}

                {(curriculo?.valor_hora_padrao || curriculo?.porcentagem_repasse || curriculo?.chave_pix) && (
                    <div className="mt-6 border-t pt-4 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">
                            Dados Financeiros
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-xs text-gray-400 uppercase mb-1">Valor Hora</h4>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {curriculo.valor_hora_padrao ? `R$ ${Number(curriculo.valor_hora_padrao).toFixed(2)}` : '-'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs text-gray-400 uppercase mb-1">Repasse</h4>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {curriculo.porcentagem_repasse ? `${curriculo.porcentagem_repasse}%` : '-'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs text-gray-400 uppercase mb-1">Chave PIX</h4>
                                <p className="font-medium font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                                    {curriculo.chave_pix || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
