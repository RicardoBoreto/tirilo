import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ClinicaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: clinica, error } = await supabase
        .from('saas_clinicas')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !clinica) {
        notFound()
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/admin/clinicas"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-2 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Detalhes da Clínica
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            ID: #{clinica.id}
                        </p>
                    </div>
                    <Link
                        href={`/admin/clinicas/${clinica.id}/editar`}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Razão Social
                            </h3>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {clinica.razao_social}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Nome Fantasia
                            </h3>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {clinica.nome_fantasia || '-'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                CNPJ
                            </h3>
                            <p className="text-lg font-mono text-gray-900 dark:text-white">
                                {clinica.cnpj || '-'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Inscrição Estadual
                            </h3>
                            <p className="text-lg font-mono text-gray-900 dark:text-white">
                                {clinica.inscricao_estadual || '-'}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Endereço
                            </h3>
                            <p className="text-lg text-gray-900 dark:text-white">
                                {[
                                    clinica.end_logradouro,
                                    clinica.end_numero,
                                    clinica.end_complemento,
                                    clinica.end_bairro,
                                    [(clinica.end_cidade || ''), (clinica.end_estado || '')].filter(Boolean).join('/'),
                                    clinica.end_cep ? `CEP: ${clinica.end_cep}` : null
                                ].filter(Boolean).join(', ') || '-'}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Missão
                            </h3>
                            <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                                {clinica.missao || '-'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Data de Cadastro
                            </h3>
                            <p className="text-lg text-gray-900 dark:text-white">
                                {formatDate(clinica.created_at)}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Plano Atual
                            </h3>
                            <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
                                {clinica.plano_atual}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Status da Assinatura
                            </h3>
                            <span
                                className={`inline-block px-4 py-2 rounded-lg text-sm font-medium capitalize ${clinica.status_assinatura === 'ativo'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : clinica.status_assinatura === 'inativo'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    }`}
                            >
                                {clinica.status_assinatura}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Cor Primária
                            </h3>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                                    style={{ backgroundColor: clinica.config_cor_primaria }}
                                />
                                <span className="text-lg font-mono text-gray-900 dark:text-white">
                                    {clinica.config_cor_primaria}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                URL do Logo
                            </h3>
                            {clinica.logo_url ? (
                                <a
                                    href={clinica.logo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 break-all"
                                >
                                    {clinica.logo_url}
                                </a>
                            ) : (
                                <p className="text-gray-900 dark:text-white">-</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
