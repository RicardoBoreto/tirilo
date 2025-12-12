'use client'

import { useState, useEffect } from 'react'
import ClinicSidebar from '@/components/ClinicSidebar'
import { Menu, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database.types'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row']

export default function ClinicLayoutWrapper({
    children,
    clinica
}: {
    children: React.ReactNode
    clinica: Clinica
}) {
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
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="hidden md:block fixed left-0 top-0 z-40 w-64 h-screen border-r border-gray-200 dark:border-gray-700">
                    <ClinicSidebar clinica={clinica} />
                </div>
                <main className="pl-0 md:pl-64 transition-all duration-300">
                    <div className="p-4 md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>
                    {children}
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar Desktop/Mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-[50] flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-visible
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20'}
                `}
            >
                <div className="relative h-full w-full">
                    {/* 
                        Pass 'collapsed' prop to Sidebar:
                        - On Mobile: isSidebarOpen determines visibility. If open, it's not collapsed.
                        - On Desktop: !isSidebarOpen means collapsed (mini mode).
                    */}
                    <ClinicSidebar
                        clinica={clinica}
                        collapsed={!isSidebarOpen}
                    />

                    {/* Botão de Alternar (Desktop/Tablet) */}
                    <button
                        onClick={toggleSidebar}
                        className={`absolute top-12 -right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full h-7 w-7 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hidden md:flex items-center justify-center z-50`}
                        title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                    </button>
                    {/* 
                       Note: Used Menu icon for expand since ChevronRight might look weird if user expects hamburger. 
                       Actually, let's stick to Chevron for expand/collapse logic consistency or just flip the chevron?
                       Let's use a flipped chevron for 'expand'.
                    */}
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}
                `}
            >
                {/* Menu Toggle (Apenas Mobile, pois desktop tem o mini-sidebar) */}
                <div className="p-4 md:hidden block">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-500"
                        title="Mostrar menu"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>

                {children}
            </main>
        </div>
    )
}
