'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { CuteBuilding, CuteUsers, CuteStethoscope, CuteSettings } from '@/components/icons/CuteIcons'
import { Box, Package, Calendar, Sparkles, LifeBuoy, Users, LayoutDashboard } from 'lucide-react'

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
}

export default function Sidebar({ clinic, userRole, userId, className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()

    const masterLinks = [
        {
            href: '/admin/clinicas',
            label: 'Clínicas',
            icon: <CuteBuilding className="w-6 h-6" />,
        },
        {
            href: '/admin/help-desk',
            label: 'Suporte',
            icon: <LifeBuoy className="w-6 h-6" />,
        },
    ]

    const clinicLinks = [
        {
            href: '/admin/recepcao',
            label: 'Recepção',
            icon: <LayoutDashboard className="w-6 h-6" />,
        },
        {
            href: '/admin/pacientes',
            label: 'Pacientes',
            icon: <CuteUsers className="w-6 h-6" />,
        },
        {
            href: '/admin/agenda',
            label: 'Agenda',
            icon: <Calendar className="w-6 h-6" />,
        },
        {
            href: '/admin/equipe',
            label: 'Equipe',
            icon: <Users className="w-6 h-6" />,
        },
        {
            href: '/admin/salas',
            label: 'Salas',
            icon: <Box className="w-6 h-6" />,
        },
        {
            href: '/admin/recursos',
            label: 'Materiais',
            icon: <Package className="w-6 h-6" />,
        },
        {
            href: '/admin/prompts-ia',
            label: 'Assistente IA',
            icon: <Sparkles className="w-6 h-6" />,
        },
        {
            href: '/admin/help-desk',
            label: 'Suporte',
            icon: <LifeBuoy className="w-6 h-6" />,
        },
        {
            href: '/admin/configuracoes',
            label: 'Configurações',
            icon: <CuteSettings className="w-6 h-6" />,
        },
    ]

    const links = clinic
        ? [
            ...clinicLinks.filter(link => {
                if (userRole === 'terapeuta' && link.href === '/admin/configuracoes') return false
                if (userRole === 'terapeuta' && link.href === '/admin/equipe') return false // Terapeutas don't manage team
                if (userRole === 'terapeuta' && link.href === '/admin/salas') return false // Terapeutas don't manage rooms
                if (userRole === 'terapeuta' && link.href === '/admin/recepcao') return false // Terapeutas don't see reception dash
                if (userRole === 'recepcao' && link.href === '/admin/prompts-ia') return false // Recepcao doesn't manage IA prompts
                if (userRole === 'recepcao' && link.href === '/admin/configuracoes') return false // Recepcao doesn't manage clinic settings
                return true
            }),
            ...(userRole === 'terapeuta' && userId ? [{
                href: `/admin/terapeutas/${userId}/editar`,
                label: 'Meu Perfil',
                icon: <CuteUsers className="w-6 h-6" />,
            }] : [])
        ]
        : masterLinks

    return (
        <aside className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 ${className || ''}`}>
            <div className="h-full flex flex-col">
                <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                    {clinic?.logo_url ? (
                        <div className="relative w-28 h-28 mb-4 rounded-3xl overflow-hidden shadow-sm border-2 border-gray-50">
                            <Image
                                src={clinic.logo_url}
                                alt="Logo"
                                fill
                                className="object-contain p-2"
                            />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary font-bold text-3xl mb-4 shadow-inner">
                            {clinic?.nome_fantasia?.charAt(0) || 'T'}
                        </div>
                    )}
                    <h1 className="text-xl font-heading font-bold text-gray-800 dark:text-white truncate w-full">
                        {clinic?.nome_fantasia || clinic?.razao_social || 'SaaS Tirilo'}
                    </h1>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                        {clinic ? 'Painel da Clínica' : 'Admin Panel'}
                    </p>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onLinkClick}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-105'
                                    }`}
                            >
                                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {link.icon}
                                </div>
                                <span className="font-medium text-base">{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-medium">
                        Feito com 💙 para o Tirilo
                    </p>
                </div>
            </div>
        </aside>
    )
}
