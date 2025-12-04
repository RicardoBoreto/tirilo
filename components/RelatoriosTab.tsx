'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Eye, User, Calendar, Printer, FileDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import jsPDF from 'jspdf'

interface Relatorio {
    id: number
    created_at: string
    relatorio_gerado: string
    status: string
    terapeuta?: {
        nome_completo: string
    }
    agendamento?: {
        data_hora_inicio: string
    }
}

interface RelatoriosTabProps {
    relatorios?: Relatorio[]
    pacienteNome?: string
}

export default function RelatoriosTab({ relatorios = [], pacienteNome }: RelatoriosTabProps) {
    const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null)

    const getRelatorioDate = (relatorio: Relatorio) => {
        if (relatorio.agendamento?.data_hora_inicio) {
            return new Date(relatorio.agendamento.data_hora_inicio)
        }
        return new Date(relatorio.created_at)
    }

    const handlePrint = () => {
        if (!selectedRelatorio) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const date = getRelatorioDate(selectedRelatorio)
        const content = selectedRelatorio.relatorio_gerado
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Basic bold markdown support

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Atendimento - ${format(date, "dd/MM/yyyy", { locale: ptBR })}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        h1 {
                            font-size: 24px;
                            margin-bottom: 10px;
                            color: #1a1a1a;
                        }
                        .meta {
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 1px solid #eee;
                            color: #666;
                            font-size: 14px;
                        }
                        .content {
                            white-space: pre-wrap;
                        }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Atendimento</h1>
                    <div class="meta">
                        <p><strong>Data da Sessão:</strong> ${format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        <p><strong>Terapeuta:</strong> ${selectedRelatorio.terapeuta?.nome_completo || 'Não identificado'}</p>
                    </div>
                    <div class="content">${content}</div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleGeneratePDF = () => {
        if (!selectedRelatorio) return

        const date = getRelatorioDate(selectedRelatorio)
        const doc = new jsPDF()

        // Configurações
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let yPosition = margin

        // Título
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Relatório de Atendimento', margin, yPosition)
        yPosition += 10

        // Linha separadora
        doc.setLineWidth(0.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        // Metadados
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Data da Sessão: ${format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition)
        yPosition += 6
        doc.text(`Terapeuta: ${selectedRelatorio.terapeuta?.nome_completo || 'Não identificado'}`, margin, yPosition)
        yPosition += 10

        // Linha separadora
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        // Conteúdo do relatório
        doc.setFontSize(11)
        const content = selectedRelatorio.relatorio_gerado
        const lines = doc.splitTextToSize(content, maxWidth)

        lines.forEach((line: string) => {
            // Verifica se precisa de nova página
            if (yPosition > pageHeight - margin) {
                doc.addPage()
                yPosition = margin
            }
            doc.text(line, margin, yPosition)
            yPosition += 6
        })

        // Salvar PDF
        // Sanitizar nome do paciente para uso em nome de arquivo
        const nomeSanitizado = pacienteNome
            ? pacienteNome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
            : 'Paciente'
        const fileName = `Relatorio_${nomeSanitizado}_${format(date, 'yyyy-MM-dd')}.pdf`
        doc.save(fileName)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Relatórios de Atendimento
                </h2>
            </div>

            {relatorios.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Nenhum relatório encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Os relatórios gerados na agenda aparecerão aqui.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {relatorios.map((relatorio) => {
                        const date = getRelatorioDate(relatorio)
                        return (
                            <div
                                key={relatorio.id}
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        {format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <User className="w-4 h-4 text-purple-500" />
                                        {relatorio.terapeuta?.nome_completo || 'Terapeuta não identificado'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${relatorio.status === 'finalizado'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {relatorio.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedRelatorio(relatorio)}
                                    className="gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Visualizar
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog open={!!selectedRelatorio} onOpenChange={(open) => !open && setSelectedRelatorio(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>Relatório de Atendimento</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="gap-2">
                                    <FileDown className="w-4 h-4" />
                                    Baixar PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                    <Printer className="w-4 h-4" />
                                    Imprimir
                                </Button>
                            </div>
                        </DialogTitle>
                        <div className="text-sm text-gray-500">
                            {selectedRelatorio && format(getRelatorioDate(selectedRelatorio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                    </DialogHeader>

                    <div className="mt-4 prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        {selectedRelatorio?.relatorio_gerado}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
