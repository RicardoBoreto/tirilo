'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, X } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface FaturaModalProps {
    isOpen: boolean
    onClose: () => void
    dados: {
        lancamento: any
        agendamentos: any[]
    } | null
}

export default function FaturaModal({ isOpen, onClose, dados }: FaturaModalProps) {
    const componentRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: componentRef as any, // Type cast fix for RefObject
        documentTitle: `Fatura-${dados?.lancamento?.id}`
    })

    if (!dados) return null

    const { lancamento, agendamentos } = dados
    const clinica = lancamento.clinica || {}
    const responsavel = lancamento.responsavel || {}
    const paciente = lancamento.paciente || {}

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-0 rounded-xl">
                <div className="sticky top-0 z-10 bg-white border-b p-4 flex justify-between items-center no-print">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        📄 Visualizar Fatura
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handlePrint && handlePrint()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 bg-white min-h-[800px] text-gray-900" ref={componentRef}>
                    {/* Header Clínica */}
                    <div className="flex justify-between border-b pb-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-emerald-700 uppercase tracking-wide">
                                {clinica.nome_fantasia || 'Clínica Tirilo'}
                            </h1>
                            <div className="text-sm text-gray-500 mt-2 space-y-1">
                                <p>{clinica.endereco || 'Endereço não cadastrado'}</p>
                                <p>{clinica.telefone} • {clinica.email}</p>
                                {clinica.cnpj && <p>CNPJ: {clinica.cnpj}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-400 font-light text-sm uppercase">Fatura Nº</div>
                            <div className="text-3xl font-bold text-gray-800">#{lancamento.id.toString().padStart(6, '0')}</div>
                            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase
                                ${lancamento.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {lancamento.status}
                            </div>
                        </div>
                    </div>

                    {/* Dados do Cliente */}
                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                        <div>
                            <h3 className="font-bold text-gray-400 uppercase text-xs mb-2">Faturado Para:</h3>
                            <p className="font-bold text-lg">{responsavel.nome || paciente.nome || 'Cliente'}</p>
                            {responsavel.endereco && <p className="text-gray-600">{responsavel.endereco}</p>}
                            {responsavel.cidade && <p className="text-gray-600">{responsavel.cidade} - {responsavel.estado}</p>}
                            {responsavel.cpf && <p className="text-gray-600">CPF: {responsavel.cpf}</p>}
                            <p className="text-gray-600 mt-1">Paciente: <span className="font-semibold">{paciente.nome}</span></p>
                        </div>
                        <div className="text-right">
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-400 uppercase text-xs">Data de Vencimento:</h3>
                                <p className="font-medium">{new Date(lancamento.data_vencimento).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-400 uppercase text-xs">Valor Total:</h3>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lancamento.valor)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Itens */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="text-left py-3 font-bold text-gray-600 uppercase text-xs">Descrição</th>
                                    <th className="text-left py-3 font-bold text-gray-600 uppercase text-xs">Data</th>
                                    <th className="text-left py-3 font-bold text-gray-600 uppercase text-xs">Profissional</th>
                                    <th className="text-right py-3 font-bold text-gray-600 uppercase text-xs">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {/* Se tiver agendamentos detalhados */}
                                {agendamentos.length > 0 ? (
                                    agendamentos.map((item: any, idx: number) => (
                                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50/50' : ''}>
                                            <td className="py-3 px-1">
                                                <span className="font-medium text-gray-900">Sessão {item.tipo_sessao === 'individual' ? 'Terapia Individual' : item.tipo_sessao}</span>
                                            </td>
                                            <td className="py-3 text-gray-600">{new Date(item.data_hora_inicio).toLocaleDateString()} {new Date(item.data_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="py-3 text-gray-600">{item.terapeuta?.nome_completo || '-'}</td>
                                            <td className="py-3 text-right font-medium text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_sessao || 0)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    /* Fallback se não detectar agendamentos (cobrança manual) */
                                    <tr>
                                        <td colSpan={3} className="py-4">
                                            <span className="font-medium">{lancamento.descricao}</span>
                                            <p className="text-xs text-gray-500">Cobrança avulsa ou mensalidade consolidada</p>
                                        </td>
                                        <td className="py-4 text-right font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lancamento.valor)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-100">
                                    <td colSpan={3} className="py-4 text-right font-bold text-gray-600 uppercase text-xs">Total a Pagar</td>
                                    <td className="py-4 text-right font-bold text-xl text-emerald-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lancamento.valor)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer / Nota Legal */}
                    <div className="text-center text-xs text-gray-400 mt-16 pt-8 border-t border-gray-100">
                        <p>Documento gerado eletronicamente em {new Date().toLocaleDateString()}. Não possui valor fiscal sem o respectivo documento de NF-e, se aplicável.</p>
                        <p className="mt-1 font-medium">{clinica.nome_fantasia}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
