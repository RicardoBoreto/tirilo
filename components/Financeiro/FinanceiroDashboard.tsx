'use client'

import { useEffect, useState } from 'react'
import { getResumoFinanceiro } from '@/lib/actions/financeiro'
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'

export default function FinanceiroDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [mes, setMes] = useState(new Date().getMonth() + 1)
    const [ano, setAno] = useState(new Date().getFullYear())

    const [userProfile, setUserProfile] = useState<any>(null)

    const [checkingProfile, setCheckingProfile] = useState(true)

    useEffect(() => {
        // Check filtering
        import('@/lib/actions/equipe').then(({ getCurrentUserProfile }) => {
            getCurrentUserProfile().then(user => {
                setUserProfile(user)
            }).finally(() => {
                setCheckingProfile(false)
            })
        })
    }, [])

    useEffect(() => {
        if (!checkingProfile) loadStats()
    }, [mes, ano, checkingProfile, userProfile])

    async function loadStats() {
        setLoading(true)
        try {
            // If therapist, pass ID. Otherwise 'todos' (undefined)
            const terapeutaId = userProfile?.tipo_perfil === 'terapeuta' ? userProfile.id : undefined
            const data = await getResumoFinanceiro(mes, ano, terapeutaId)
            setStats(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    return (
        <div className="space-y-6 pt-6 mb-8">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    Visão Geral {userProfile?.tipo_perfil === 'terapeuta' ? '(Minha Produção)' : ''}
                </h2>
                <div className="flex gap-2">
                    <select
                        value={mes}
                        onChange={(e) => setMes(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                        {meses.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={ano}
                        onChange={(e) => setAno(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Carregando indicadores...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Receitas */}
                    <Card
                        title="Receitas"
                        icon={<ArrowUpCircle className="text-emerald-500" size={24} />}
                        value={stats?.receitaRealizada}
                        subtitle={`Previsto: ${formatCurrency(stats?.receitaPrevista)}`}
                        color="emerald"
                    />

                    {/* Despesas */}
                    <Card
                        title="Despesas"
                        icon={<ArrowDownCircle className="text-rose-500" size={24} />}
                        value={stats?.despesaRealizada}
                        subtitle={`Previsto: ${formatCurrency(stats?.despesaPrevista)}`}
                        color="rose"
                    />

                    {/* Saldo */}
                    <Card
                        title="Saldo Realizado"
                        icon={<Wallet className="text-blue-500" size={24} />}
                        value={stats?.saldoRealizado}
                        subtitle={`Projetado: ${formatCurrency(stats?.saldoPrevisto)}`}
                        color="blue"
                    />
                </div>
            )}
        </div>
    )
}

function Card({ title, icon, value, subtitle, color }: any) {
    const colors = {
        emerald: 'bg-emerald-50 border-emerald-100',
        rose: 'bg-rose-50 border-rose-100',
        blue: 'bg-blue-50 border-blue-100'
    }

    return (
        <div className={`p-6 rounded-2xl border ${colors[color as keyof typeof colors]} dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 dark:text-gray-400 font-medium">{title}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(value)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
            </div>
        </div>
    )
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
