'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { getSidebarLinks } from '@/lib/nav-config'

interface SidebarProps {
    clinic?: {
        logo_url: string | null
        nome_fantasia: string | null
        razao_social: string
        config_cor_primaria: string
    } | null
    userRole?: string
    userId?: string
    className?: string
    onLinkClick?: () => void
    systemVersion?: string
}


export default function Sidebar({ clinic, userRole, userId, className, onLinkClick, collapsed = false, systemVersion }: SidebarProps & { collapsed?: boolean }) {
    const pathname = usePathname()
    const links = getSidebarLinks(clinic, userRole, userId)

    return (
        <aside className={`bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 ${className || ''} ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
            <div className="h-full flex flex-col">
                <div className={`border-b border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-all duration-300 ${collapsed ? 'p-4' : 'p-8'}`}>
                    {clinic?.logo_url ? (
                        <div className={`relative mb-4 rounded-3xl overflow-hidden shadow-sm border-2 border-gray-50 transition-all duration-300 ${collapsed ? 'w-10 h-10 rounded-xl' : 'w-28 h-28'}`}>
                            <Image
                                src={clinic.logo_url}
                                alt="Logo"
                                fill
                                sizes="(max-width: 768px) 40px, 112px"
                                className="object-contain p-2"
                            />
                        </div>
                    ) : (
                        <div className={`bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner transition-all duration-300 ${collapsed ? 'w-10 h-10 rounded-xl text-lg mb-2' : 'w-20 h-20 rounded-3xl text-3xl mb-4'}`}>
                            {clinic?.nome_fantasia?.charAt(0) || 'T'}
                        </div>
                    )}

                    {!collapsed && (
                        <>
                            <h1 className="text-xl font-heading font-bold text-gray-800 dark:text-white truncate w-full animate-in fade-in slide-in-from-left-4 duration-300">
                                {clinic?.nome_fantasia || clinic?.razao_social || 'SaaS Tirilo'}
                            </h1>
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider animate-in fade-in slide-in-from-left-4 duration-500">
                                {clinic ? 'Painel da Clínica' : 'Admin Panel'}
                            </p>
                        </>
                    )}
                </div>

                <nav className={`flex-1 space-y-3 overflow-y-auto ${collapsed ? 'p-2' : 'p-6'}`}>
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onLinkClick}
                                className={`flex items-center gap-4 rounded-2xl transition-all duration-200 group relative
                                    ${collapsed ? 'justify-center px-0 py-3' : 'px-6 py-4'}
                                    ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-105'
                                    }`}
                                title={collapsed ? link.label : ''}
                            >
                                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {link.icon}
                                </div>
                                {!collapsed && <span className="font-medium text-base whitespace-nowrap">{link.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div className={`border-t border-gray-100 dark:border-gray-700 ${collapsed ? 'p-4' : 'p-6'}`}>
                    <p className={`text-xs text-gray-400 dark:text-gray-500 text-center font-medium ${collapsed ? 'hidden' : 'block'}`}>
                        Feito com 💙 para o Tirilo
                        {systemVersion && (userRole === 'super_admin' || userRole === 'master_admin') && (
                            <span className="block text-[10px] opacity-70 mt-1">v{systemVersion}</span>
                        )}
                    </p>
                    {collapsed && <div className="w-full text-center text-xs">💙</div>}
                </div>
            </div>
        </aside>
    )
}
