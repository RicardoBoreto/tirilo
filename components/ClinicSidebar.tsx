'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database } from '@/types/database.types'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row']

export default function ClinicSidebar({ clinica }: { clinica: Clinica }) {
    // Force Update Sidebar
    const pathname = usePathname()
    const clinicaId = clinica.id

    const links = [
        {
            href: `/clinica/${clinicaId}/terapeutas`,
            label: 'Terapeutas',
            icon: '🩺'
        },
        {
            href: `/clinica/${clinicaId}/pacientes`,
            label: 'Pacientes',
            icon: '🧸'
        },
        {
            href: `/clinica/${clinicaId}/loja`,
            label: 'Loja de Apps',
            icon: '🛍️'
        },
    ]

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0">
            <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
                    {clinica.logo_url ? (
                        <img
                            src={clinica.logo_url}
                            alt={clinica.razao_social}
                            className="h-12 w-auto object-contain mb-3"
                        />
                    ) : (
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-3">
                            {clinica.razao_social.charAt(0)}
                        </div>
                    )}
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate w-full">
                        {clinica.nome_fantasia || clinica.razao_social}
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="text-xl">{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/admin/clinicas"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        ← Voltar para Admin
                    </Link>
                </div>
            </div>
        </aside>
    )
}
