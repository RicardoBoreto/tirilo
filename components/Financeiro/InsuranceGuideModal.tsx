'use client'

import { X, Printer } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

type Appointment = {
    id: number
    data_hora_inicio: string
    paciente: { nome: string; convenio_nome?: string; convenio_numero_carteirinha?: string }
    terapeuta: { nome_completo: string }
}

type Props = {
    isOpen: boolean
    onClose: () => void
    appointments: Appointment[]
    clinica?: {
        nome_fantasia: string
        razao_social?: string
        cnpj?: string
        endereco?: string
        telefone?: string
        email?: string
        logo_url?: string
        config_cor_primaria?: string
    } | null
}

export default function InsuranceGuideModal({ isOpen, onClose, appointments, clinica }: Props) {
    const componentRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: componentRef as any,
        documentTitle: `Guia_Assinatura_${new Date().toISOString().split('T')[0]}`,
    })

    if (!isOpen) return null

    // Group by patient to generate separate sheets if needed, 
    // but for now let's assume the user selects appropriately or we render all in sequence.
    // Let's Group by Patient just in case.
    const byPatient = appointments.reduce((acc, curr) => {
        const name = curr.paciente.nome
        if (!acc[name]) acc[name] = []
        acc[name].push(curr)
        return acc
    }, {} as Record<string, Appointment[]>)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="tex-lg font-semibold text-gray-800 dark:text-gray-200">
                        Visualizar Guia de Assinatura
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePrint && handlePrint()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-8">
                    <div ref={componentRef} className="bg-white text-black p-8 max-w-3xl mx-auto shadow-sm min-h-[29.7cm] print:shadow-none">
                        {/* Printable Area - Iterate Patients */}
                        {Object.entries(byPatient).map(([patientName, appts], index) => (
                            <div key={patientName} className={index > 0 ? "page-break-before mt-10 print:mt-0" : ""}>
                                {/* Header da Ficha */}
                                <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        {clinica?.logo_url && (
                                            <img
                                                src={clinica.logo_url}
                                                alt="Logo Clínica"
                                                className="h-16 w-auto object-contain"
                                            />
                                        )}
                                        <div>
                                            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: clinica?.config_cor_primaria }}>
                                                {clinica?.nome_fantasia || 'Sua Clínica'}
                                            </h1>
                                            <p className="text-sm text-gray-600">
                                                {clinica?.endereco || 'Endereço não cadastrado'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {clinica?.telefone} {clinica?.email ? `• ${clinica.email}` : ''}
                                            </p>
                                            {clinica?.cnpj && <p className="text-sm text-gray-600">CNPJ: {clinica.cnpj}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-bold text-gray-800">GUIA DE ATENDIMENTO</h2>
                                        <p className="text-sm text-gray-500">Convênio</p>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="mb-8 border border-gray-300 rounded p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Paciente</p>
                                            <p className="font-semibold text-lg">{patientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Carteirinha</p>
                                            <p className="font-mono text-lg tracking-wider">
                                                {appts[0].paciente.convenio_numero_carteirinha || '_______________________'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Convênio</p>
                                            <p>{appts[0].paciente.convenio_nome || 'Particular / Outro'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Mês/Ano</p>
                                            <p>{new Date(appts[0].data_hora_inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-3 py-2 text-left w-24">Data</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left w-20">Hora</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left">Profissional</th>
                                            <th className="border border-gray-300 px-3 py-2 text-center w-48">Assinatura do Paciente/Resp.</th>
                                            <th className="border border-gray-300 px-3 py-2 text-center w-32">Carimbo/Ass. Prof.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appts.map(item => (
                                            <tr key={item.id}>
                                                <td className="border border-gray-300 px-3 py-3">
                                                    {new Date(item.data_hora_inicio).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-3">
                                                    {new Date(item.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-3">
                                                    {item.terapeuta.nome_completo}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-3"></td>
                                                <td className="border border-gray-300 px-3 py-3"></td>
                                            </tr>
                                        ))}
                                        {/* Create empty rows to fill page if needed */}
                                        {Array.from({ length: Math.max(0, 10 - appts.length) }).map((_, i) => (
                                            <tr key={`empty-${i}`}>
                                                <td className="border border-gray-300 px-3 py-4">&nbsp;</td>
                                                <td className="border border-gray-300 px-3 py-4"></td>
                                                <td className="border border-gray-300 px-3 py-4"></td>
                                                <td className="border border-gray-300 px-3 py-4"></td>
                                                <td className="border border-gray-300 px-3 py-4"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Footer */}
                                <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
                                    <p>Declaro que os atendimentos acima foram realizados.</p>
                                    <div className="flex justify-between mt-16 px-12">
                                        <div className="border-t border-black w-64 pt-2">
                                            Assinatura do Responsável
                                        </div>
                                        <div className="border-t border-black w-64 pt-2">
                                            Assinatura da Clínica / Carimbo
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    .page-break-before { page-break-before: always; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    )
}
