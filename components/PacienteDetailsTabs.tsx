'use client'

import { useState } from 'react'
import type { Paciente, Anamnese } from '@/lib/actions/pacientes'
import type { Terapeuta } from '@/lib/actions/terapeutas'
import ResponsaveisTab from './ResponsaveisTab'
import AnamneseTab from './AnamneseTab'
import TerapeutasTab from './TerapeutasTab'
import RelatoriosTab from './RelatoriosTab'

type Props = {
    paciente: Paciente
    responsaveis: any[]
    anamnese: Anamnese | null
    allTerapeutas: Terapeuta[]
    linkedTerapeutaIds: string[]
    relatorios: any[]
    clinicLogo?: string | null
    clinicName?: string | null
}

export default function PacienteDetailsTabs({
    paciente,
    responsaveis,
    anamnese,
    allTerapeutas,
    linkedTerapeutaIds,
    relatorios,
    clinicLogo,
    clinicName
}: Props) {
    const [activeTab, setActiveTab] = useState<'dados' | 'responsaveis' | 'terapeutas' | 'anamnese' | 'relatorios'>('dados')

    const tabs = [
        { id: 'dados' as const, label: 'Dados Básicos', icon: '👤' },
        { id: 'responsaveis' as const, label: 'Responsáveis', icon: '👨‍👩‍👧' },
        { id: 'terapeutas' as const, label: 'Terapeutas', icon: '🩺' },
        { id: 'anamnese' as const, label: 'Anamnese', icon: '📋' },
        { id: 'relatorios' as const, label: 'Relatórios', icon: '📝' },
    ]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Tabs Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tabs Content */}
            <div className="p-6">
                {activeTab === 'dados' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Informações do Paciente
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome Completo
                                </label>
                                <p className="text-gray-900 dark:text-white">{paciente.nome}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Data de Nascimento
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                                </p>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Observações
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {paciente.observacoes || 'Nenhuma observação registrada'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'responsaveis' && (
                    <ResponsaveisTab pacienteId={paciente.id} responsaveis={responsaveis} />
                )}

                {activeTab === 'terapeutas' && (
                    <TerapeutasTab
                        pacienteId={paciente.id}
                        allTerapeutas={allTerapeutas}
                        linkedTerapeutaIds={linkedTerapeutaIds}
                    />
                )}

                {activeTab === 'anamnese' && (
                    <AnamneseTab
                        pacienteId={paciente.id}
                        anamnese={anamnese}
                        pacienteNome={paciente.nome}
                        clinicLogo={clinicLogo}
                        clinicName={clinicName}
                    />
                )}

                {activeTab === 'relatorios' && (
                    <RelatoriosTab relatorios={relatorios} pacienteNome={paciente.nome} />
                )}
            </div>
        </div>
    )
}
