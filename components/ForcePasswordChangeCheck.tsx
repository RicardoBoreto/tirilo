'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function ForcePasswordChangeCheck({ needsChange }: { needsChange: boolean }) {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (needsChange && pathname !== '/admin/trocar-senha') {
            router.push('/admin/trocar-senha')
        }
    }, [needsChange, pathname, router])

    return null
}
