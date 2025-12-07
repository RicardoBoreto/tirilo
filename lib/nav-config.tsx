import { CuteBuilding, CuteUsers, CuteSettings } from '@/components/icons/CuteIcons'
import { Box, Package, Calendar, Sparkles, LifeBuoy, Users, LayoutDashboard } from 'lucide-react'

type UserRole = 'admin' | 'terapeuta' | 'recepcao' | 'super_admin' | string | undefined

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
            href: '/admin/configuracoes',
            label: 'Configurações',
            icon: <CuteSettings className="w-6 h-6" />,
        },
    ]

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
