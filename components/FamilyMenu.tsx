'use client'

import { Menu, LogOut, Settings } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FamilyMenu() {
    const router = useRouter()
    const supabase = createClient()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
                <SheetHeader className="mb-6 text-left">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                    <button
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                        onClick={() => {
                            // Navigate to settings if implemented
                            setOpen(false)
                        }}
                    >
                        <Settings className="h-5 w-5" />
                        Configurações
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left mt-auto"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
