import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ForcePasswordChangeCheck from '@/components/ForcePasswordChangeCheck'
import AdminLayoutWrapper from './AdminLayoutWrapper'
import pkg from '@/package.json'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get clinic_id
    const { data: userProfile } = await supabase
        .from('usuarios')
        .select('id_clinica, nome_completo, foto_url, tipo_perfil, precisa_trocar_senha')
        .eq('id', user.id)
        .single()

    let clinicData = null

    if (userProfile?.id_clinica) {
        const { data: clinic } = await supabase
            .from('saas_clinicas')
            .select('logo_url, nome_fantasia, razao_social, config_cor_primaria')
            .eq('id', userProfile.id_clinica)
            .single()
        clinicData = clinic
    } else {
        // Super Admin - Fetch SaaS Company Data
        const { data: saasEmpresa } = await supabase
            .from('saas_empresa')
            .select('logo_url, nome_fantasia, razao_social')
            .limit(1)
            .single()

        if (saasEmpresa) {
            clinicData = {
                ...saasEmpresa,
                config_cor_primaria: '#3b82f6' // Default Blue for Super Admin
            }
        }
    }

    return (
        <AdminLayoutWrapper
            user={user}
            userProfile={userProfile}
            clinicData={clinicData}
            systemVersion={pkg.version}
        >
            {children}
        </AdminLayoutWrapper>
    )
}

// Helper to convert hex to HSL for Tailwind
function hexToHsl(hex: string) {
    let c = hex.substring(1).split('')
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    const r = parseInt(c.slice(0, 2).join(''), 16)
    const g = parseInt(c.slice(2, 4).join(''), 16)
    const b = parseInt(c.slice(4, 6).join(''), 16)

    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255

    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    let h = 0
    let s = 0
    let l = (max + min) / 2

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break
            case gNorm: h = (bNorm - rNorm) / d + 2; break
            case bNorm: h = (rNorm - gNorm) / d + 4; break
        }
        h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
