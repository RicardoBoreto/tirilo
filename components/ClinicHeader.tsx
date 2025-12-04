import { Database } from '@/types/database.types'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row']

export default function ClinicHeader({ clinica }: { clinica: Clinica | null }) {
    if (!clinica) return null

    return (
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            {clinica.logo_url ? (
                <img
                    src={clinica.logo_url}
                    alt={clinica.razao_social}
                    className="h-16 w-auto object-contain"
                />
            ) : (
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-400">
                    {clinica.razao_social.charAt(0)}
                </div>
            )}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {clinica.nome_fantasia || clinica.razao_social}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {clinica.cnpj}
                </p>
            </div>
        </div>
    )
}
