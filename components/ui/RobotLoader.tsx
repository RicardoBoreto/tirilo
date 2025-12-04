'use client'

import { CuteRobot } from '@/components/icons/CuteIcons'

export function RobotLoader() {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <CuteRobot className="w-24 h-24 text-primary animate-bounce relative z-10" />
            </div>
            <p className="text-lg font-medium text-primary animate-pulse">
                Carregando...
            </p>
        </div>
    )
}
