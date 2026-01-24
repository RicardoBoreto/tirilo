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
        <aside className={`relative z-20 h-screen bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 ${className || ''} ${collapsed ? 'w-24' : 'w-72'} transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl shadow-slate-200/60 border-r border-slate-100`}>
            <div className="h-full flex flex-col">
                <div className={`flex flex-col items-center text-center transition-all duration-300 ${collapsed ? 'p-6' : 'p-10'}`}>
                    {clinic?.logo_url ? (
                        <div className={`relative mb-6 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-100 ring-1 ring-slate-100 transition-all duration-300 ${collapsed ? 'w-12 h-12 rounded-xl' : 'w-32 h-32'}`}>
                            <Image
                                src={clinic.logo_url}
                                alt="Logo"
                                fill
                                sizes="(max-width: 768px) 48px, 128px"
                                className="object-contain p-3"
                            />
                        </div>
                    ) : (
                        <div className={`bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20 transition-all duration-300 ${collapsed ? 'w-12 h-12 rounded-xl text-xl mb-4' : 'w-24 h-24 rounded-[2rem] text-4xl mb-6'}`}>
                            {clinic?.nome_fantasia?.charAt(0) || 'T'}
                        </div>
                    )}

                    {!collapsed && (
                        <>
                            <h1 className="text-xl font-heading font-bold text-slate-800 tracking-tight truncate w-full animate-in fade-in slide-in-from-left-4 duration-500">
                                {clinic?.nome_fantasia || clinic?.razao_social || 'SaaS Tirilo'}
                            </h1>
                            <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                                {clinic ? 'Painel da Clínica' : 'Admin Panel'}
                            </p>
                        </>
                    )}
                </div>

                <nav className={`flex-1 space-y-2 overflow-y-auto ${collapsed ? 'px-3 py-4' : 'px-8 py-6'}`}>
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onLinkClick}
                                className={`flex items-center gap-4 rounded-2xl transition-all duration-300 group relative
                                    ${collapsed ? 'justify-center px-0 py-4' : 'px-5 py-4'}
                                    ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                                    }`}
                                title={collapsed ? link.label : ''}
                            >
                                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {link.icon}
                                </div>
                                {!collapsed && <span className="font-medium text-[0.95rem] tracking-wide whitespace-nowrap">{link.label}</span>}
                                {isActive && !collapsed && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className={` ${collapsed ? 'p-4' : 'p-8'}`}>
                    <p className={`text-[10px] text-slate-300 text-center font-medium ${collapsed ? 'hidden' : 'block'}`}>
                        Feito com 💙 para o Tirilo
                        {systemVersion && (userRole === 'super_admin' || userRole === 'master_admin') && (
                            <span className="block opacity-70 mt-1">v{systemVersion}</span>
                        )}
                    </p>
                    {collapsed && <div className="w-full text-center text-xs opacity-30">💙</div>}
                </div>
            </div>
        </aside>
    )
}
