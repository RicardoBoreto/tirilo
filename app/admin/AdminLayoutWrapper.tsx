'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ForcePasswordChangeCheck from '@/components/ForcePasswordChangeCheck'
import { Menu, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLayoutWrapperProps {
    children: React.ReactNode
    user: any // Replace with proper type if available
    userProfile: any
    clinicData: any
    systemVersion?: string
}

// Helper to convert hex to HSL (reusing mostly)
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

export default function AdminLayoutWrapper({
    children,
    user,
    userProfile,
    clinicData,
    systemVersion
}: AdminLayoutWrapperProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const saved = localStorage.getItem('sidebar-open')
        if (saved !== null) {
            setIsSidebarOpen(saved === 'true')
        }
    }, [])

    const toggleSidebar = () => {
        const newState = !isSidebarOpen
        setIsSidebarOpen(newState)
        localStorage.setItem('sidebar-open', String(newState))
    }

    if (!isMounted) {
        // Initial server/first-render state match
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <ForcePasswordChangeCheck needsChange={userProfile?.precisa_trocar_senha || false} />
                {clinicData?.config_cor_primaria && (
                    <style>{`
                        :root {
                            --primary: ${hexToHsl(clinicData.config_cor_primaria)};
                        }
                    `}</style>
                )}
                <Sidebar clinic={clinicData} userRole={userProfile?.tipo_perfil || 'super_admin'} userId={user.id} systemVersion={systemVersion} className="hidden lg:block w-64" />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header user={{ ...user, ...userProfile, nome: userProfile?.nome_completo }} clinic={clinicData} />
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <ForcePasswordChangeCheck needsChange={userProfile?.precisa_trocar_senha || false} />
            {clinicData?.config_cor_primaria && (
                <style>{`
                    :root {
                        --primary: ${hexToHsl(clinicData.config_cor_primaria)};
                    }
                `}</style>
            )}

            <div
                className={`relative hidden lg:flex flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-visible
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                <Sidebar
                    clinic={clinicData}
                    userRole={userProfile?.tipo_perfil || 'super_admin'}
                    userId={user.id}
                    systemVersion={systemVersion}
                    className="w-full h-full border-none"
                    collapsed={!isSidebarOpen}
                />

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className={`absolute top-12 -right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full h-7 w-7 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 flex items-center justify-center z-50`}
                    title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                </button>
            </div>

            {/* Mobile Sheet/Drawer is typically handled inside Header or Sidebar component if it exists. 
                Looking at the previous Sidebar usage, it had className="hidden lg:block". 
                The mobile menu seems to be inside Header or controlled externally?
                In the original layout: <Sidebar ... className="hidden lg:block" />
                So mobile sidebar was hidden. Header likely has a mobile menu trigger.
            */}

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={{ ...user, ...userProfile, nome: userProfile?.nome_completo }} clinic={clinicData} userRole={userProfile?.tipo_perfil} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
