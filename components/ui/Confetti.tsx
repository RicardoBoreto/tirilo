'use client'

import { useEffect, useState } from 'react'

export function Confetti() {
    const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, color: string }>>([])

    useEffect(() => {
        const colors = ['#FFC0CB', '#FFD700', '#87CEEB', '#98FB98', '#E6E6FA']
        const newParticles = []
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: -10 - Math.random() * 20,
                color: colors[Math.floor(Math.random() * colors.length)]
            })
        }
        setParticles(newParticles)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute w-3 h-3 rounded-full animate-confetti-fall"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    )
}
