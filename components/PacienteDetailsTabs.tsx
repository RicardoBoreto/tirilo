'use client'

import { useState, useRef } from 'react'
import { Paciente, Anamnese, uploadFotoPaciente } from '@/lib/actions/pacientes'
import type { Terapeuta } from '@/lib/actions/terapeutas'
import ResponsaveisTab from './ResponsaveisTab'
import AnamneseTab from './AnamneseTab'
import TerapeutasTab from './TerapeutasTab'
import RelatoriosTab from './RelatoriosTab'
import PlanosIATab from './AI/PlanosIATab'
import LudoterapiaTab from './LudoterapiaTab'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
    paciente: Paciente
    responsaveis: any[]
    anamnese: Anamnese | null
    allTerapeutas: Terapeuta[]
    linkedTerapeutaIds: string[]
    relatorios: any[]
    planosIA: any[]
    sessoesLudicas: any[]
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
    planosIA,
    sessoesLudicas,
    clinicLogo,
    clinicName
}: Props) {
    const [activeTab, setActiveTab] = useState<'dados' | 'responsaveis' | 'terapeutas' | 'anamnese' | 'relatorios' | 'planos_ia' | 'ludoterapia'>('dados')
    const [fotoUrl, setFotoUrl] = useState(paciente.foto_url || '')
    const [uploadingFoto, setUploadingFoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingFoto(true)
        try {
            const result = await uploadFotoPaciente(paciente.id, file)
            if (result.error) {
                alert(result.error)
            } else if (result.url) {
                setFotoUrl(result.url)
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao fazer upload da foto')
        } finally {
            setUploadingFoto(false)
        }
    }

    const tabs = [
        { id: 'dados' as const, label: 'Dados Básicos', icon: '👤' },
        { id: 'responsaveis' as const, label: 'Responsáveis', icon: '👨‍👩‍👧' },
        { id: 'terapeutas' as const, label: 'Terapeutas', icon: '🩺' },
        { id: 'anamnese' as const, label: 'Anamnese', icon: '📋' },
        { id: 'ludoterapia' as const, label: 'Ludoterapia', icon: '🎮' },
        { id: 'relatorios' as const, label: 'Relatórios', icon: '📝' },
        { id: 'planos_ia' as const, label: 'Planos IA', icon: '🤖' },
    ]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Tabs Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                {/* Mobile View: Select Dropdown */}
                <div className="md:hidden p-4">
                    <Select value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
                        <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                            <SelectValue>
                                <span className="flex items-center gap-2">
                                    <span>{tabs.find(t => t.id === activeTab)?.icon}</span>
                                    <span>{tabs.find(t => t.id === activeTab)?.label}</span>
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {tabs.map((tab) => (
                                <SelectItem key={tab.id} value={tab.id}>
                                    <span className="flex items-center gap-2">
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop View: Tabs List */}
                <nav className="hidden md:flex -mb-px overflow-x-auto">
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
                        <div className="flex flex-col items-center mb-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden group"
                            >
                                {fotoUrl ? (
                                    <>
                                        <Image src={fotoUrl} alt="Foto do paciente" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {uploadingFoto ? (
                                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-gray-400" />
                                        )}
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFotoUpload}
                                    disabled={uploadingFoto}
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Clique para alterar a foto</p>
                        </div>

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

                            {/* Seção Financeira */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Financeiro
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Valor Sessão (Padrão)
                                        </label>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {paciente.valor_sessao_padrao
                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paciente.valor_sessao_padrao)
                                                : 'Não definido'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Dia de Vencimento
                                        </label>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {paciente.dia_vencimento_padrao || 'Não definido'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seção Convênio */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Convênio
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Convênio
                                        </label>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {paciente.convenio_nome || 'Particular / Não informado'}
                                        </p>
                                    </div>
                                    {paciente.convenio_nome && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                                    Nº Carteirinha
                                                </label>
                                                <p className="text-gray-900 dark:text-white font-mono">
                                                    {paciente.convenio_numero_carteirinha || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                                    Validade
                                                </label>
                                                <p className="text-gray-900 dark:text-white">
                                                    {paciente.convenio_validade
                                                        ? new Date(paciente.convenio_validade).toLocaleDateString('pt-BR')
                                                        : '-'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
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
                    <RelatoriosTab relatorios={relatorios} pacienteNome={paciente.nome} pacienteId={paciente.id} />
                )}

                {activeTab === 'ludoterapia' && (
                    <LudoterapiaTab sessoes={sessoesLudicas} />
                )}

                {activeTab === 'planos_ia' && (
                    <PlanosIATab planos={planosIA} pacienteId={paciente.id} />
                )}
            </div>
        </div>
    )
}
