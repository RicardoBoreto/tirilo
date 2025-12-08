'use client'

import { useState } from 'react'
import { Wallet, FileText, Receipt, LayoutDashboard, CreditCard } from 'lucide-react'
import FinanceiroDashboard from '@/components/Financeiro/FinanceiroDashboard'
import LancamentosTable from '@/components/Financeiro/LancamentosTable'
import FaturamentoGenerator from '@/components/Financeiro/FaturamentoGenerator'
import ContratosManager from '@/components/Financeiro/ContratosManager'

export default function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'receber' | 'faturar' | 'contratos'>('dashboard')

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary" />
                        Financeiro
                    </h1>
                    <p className="text-gray-500 text-sm">Gerencie o fluxo de caixa da sua clínica</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                <TabButton
                    active={activeTab === 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}
                    icon={<LayoutDashboard size={18} />}
                    label="Visão Geral"
                />
                <TabButton
                    active={activeTab === 'receber'}
                    onClick={() => setActiveTab('receber')}
                    icon={<Receipt size={18} />}
                    label="Contas a Receber"
                />
                <TabButton
                    active={activeTab === 'faturar'}
                    onClick={() => setActiveTab('faturar')}
                    icon={<CreditCard size={18} />}
                    label="Faturar"
                />
                <TabButton
                    active={activeTab === 'contratos'}
                    onClick={() => setActiveTab('contratos')}
                    icon={<FileText size={18} />}
                    label="Contratos"
                />
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'dashboard' && <FinanceiroDashboard />}
                {activeTab === 'receber' && <LancamentosTable tipo="receita" />}
                {activeTab === 'faturar' && <FaturamentoGenerator />}
                {activeTab === 'contratos' && <ContratosManager />}
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
                ${active
                    ? 'bg-white dark:bg-gray-800 text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
            `}
        >
            {icon}
            {label}
        </button>
    )
}
