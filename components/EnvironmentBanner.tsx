'use client'

interface EnvironmentBannerProps {
    env: string
}

export function EnvironmentBanner({ env }: EnvironmentBannerProps) {
    if (env !== 'staging') return null

    return (
        <div className="bg-amber-500 text-white text-center py-1 px-4 text-xs font-bold uppercase tracking-wider sticky top-0 z-[9999] shadow-md flex items-center justify-center gap-2">
            <span className="animate-pulse">⚠️</span>
            AMBIENTE DE TESTES (STAGING) - DADOS NÃO REAIS
            <span className="animate-pulse">⚠️</span>
        </div>
    )
}
