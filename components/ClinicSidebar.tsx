'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database } from '@/types/database.types'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row']


export default function ClinicSidebar({ clinica, collapsed = false }: { clinica: Clinica, collapsed?: boolean }) {
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
        <aside className="w-full h-full bg-white dark:bg-gray-800 flex flex-col transition-all duration-300">
            <div className="h-full flex flex-col">
                <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center text-center transition-all ${collapsed ? 'px-2' : ''}`}>
                    {clinica.logo_url ? (
                        <img
                            src={clinica.logo_url}
                            alt={clinica.razao_social}
                            className={`${collapsed ? 'h-8' : 'h-12'} w-auto object-contain transition-all ${!collapsed ? 'mb-3' : ''}`}
                        />
                    ) : (
                        <div className={`${collapsed ? 'h-8 w-8 text-sm' : 'h-12 w-12 text-xl'} bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold transition-all ${!collapsed ? 'mb-3' : ''}`}>
                            {clinica.razao_social.charAt(0)}
                        </div>
                    )}

                    {!collapsed && (
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate w-full animate-in fade-in duration-300">
                            {clinica.nome_fantasia || clinica.razao_social}
                        </h1>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all 
                                    ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }
                                    ${collapsed ? 'justify-center px-2' : ''}
                                `}
                                title={collapsed ? link.label : ''}
                            >
                                <span className="text-xl">{link.icon}</span>
                                {!collapsed && <span>{link.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/admin/clinicas"
                        className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 ${collapsed ? 'justify-center' : ''}`}
                        title="Voltar para Admin"
                    >
                        {collapsed ? <span>←</span> : <span>← Voltar para Admin</span>}
                    </Link>
                </div>
            </div>
        </aside>
    )
}
