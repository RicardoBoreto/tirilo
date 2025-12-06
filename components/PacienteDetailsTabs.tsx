'use client'

import { useState, useRef } from 'react'
import { Paciente, Anamnese, uploadFotoPaciente } from '@/lib/actions/pacientes'
import type { Terapeuta } from '@/lib/actions/terapeutas'
import ResponsaveisTab from './ResponsaveisTab'
import AnamneseTab from './AnamneseTab'
import TerapeutasTab from './TerapeutasTab'
import RelatoriosTab from './RelatoriosTab'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

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
