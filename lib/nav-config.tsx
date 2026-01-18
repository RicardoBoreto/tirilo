import { CuteBuilding, CuteUsers, CuteSettings } from '@/components/icons/CuteIcons'
import { Box, Package, Calendar, Sparkles, LifeBuoy, Users, LayoutDashboard, Wallet, Bot, Gamepad2, ShoppingBag, Building2 } from 'lucide-react'

type UserRole = 'admin' | 'terapeuta' | 'recepcao' | 'financeiro' | 'super_admin' | string | undefined

interface ClinicData {
    logo_url: string | null
    nome_fantasia: string | null
    razao_social: string
    config_cor_primaria: string
}

export interface NavLink {
    href: string
    label: string
    icon: React.ReactNode
}

export function getSidebarLinks(
    clinic: ClinicData | null | undefined,
    userRole: UserRole,
    userId?: string
): NavLink[] {
    const masterLinks: NavLink[] = [
        {
            href: '/admin/clinicas',
            label: 'Clínicas',
            icon: <CuteBuilding className="w-6 h-6" />,
        },
        {
            href: '/admin/help-desk',
            label: 'Suporte',
            icon: <LifeBuoy className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/robo',
            label: 'Robôs',
            icon: <Bot className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/jogos',
            label: 'Gerenciar Jogos',
            icon: <Gamepad2 className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/configuracoes-saas',
            label: 'Configurações SaaS',
            icon: <CuteSettings className="w-6 h-6" />,
        },
    ]

    const clinicLinks: NavLink[] = [
        {
            href: '/admin/recepcao',
            label: 'Recepção',
            icon: <LayoutDashboard className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/pacientes',
            label: 'Pacientes',
            icon: <CuteUsers className="w-6 h-6" />,
        },
        {
            href: '/admin/agenda',
            label: 'Agenda',
            icon: <Calendar className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/equipe',
            label: 'Equipe',
            icon: <Users className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/salas',
            label: 'Salas',
            icon: <Box className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/financeiro',
            label: 'Financeiro',
            icon: <Wallet className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/recursos',
            label: 'Materiais',
            icon: <Package className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/prompts-ia',
            label: 'Assistente IA',
            icon: <Sparkles className="w-6 h-6" color="#4F46E5" />,
        },
        {
            href: '/admin/help-desk',
            label: 'Suporte',
            icon: <LifeBuoy className="w-6 h-6" color="#4F46E5" />,
        },

        {
            href: '/admin/convenios',
            label: 'Convênios',
            icon: <Building2 className="w-6 h-6" color="#4F46E5" />,
        },

        {
            href: '/admin/configuracoes',
            label: 'Configurações',
            icon: <CuteSettings className="w-6 h-6" />,
        },
        {
            href: '/admin/loja',
            label: 'Loja de Apps',
            icon: <ShoppingBag className="w-6 h-6" color="#4F46E5" />,
        },
    ]

    if (userRole === 'super_admin' || userRole === 'master_admin') {
        return masterLinks
    }

    if (!clinic) {
        return masterLinks
    }

    const filteredClinicLinks = clinicLinks.filter(link => {
        // Terapeutas restrictions
        if (userRole === 'terapeuta') {
            if (link.href === '/admin/configuracoes') return false
            if (link.href === '/admin/equipe') return false
            if (link.href === '/admin/salas') return false
            if (link.href === '/admin/recepcao') return false
        }

        // Recepcao restrictions
        if (userRole === 'recepcao') {
            if (link.href === '/admin/prompts-ia') return false
            if (link.href === '/admin/configuracoes') return false
            if (link.href === '/admin/financeiro') return false
        }



        return true
    })

    // Add dynamic "Meu Perfil" link for therapists
    if (userRole === 'terapeuta' && userId) {
        filteredClinicLinks.push({
            href: `/admin/terapeutas/${userId}/editar`,
            label: 'Meu Perfil',
            icon: <CuteUsers className="w-6 h-6" />,
        })
    }

    return filteredClinicLinks
}

