'use client'
import { Card } from '@/components/ui/card'

export default function FamiliaRelatoriosTab({ relatorios }: { relatorios: any[] }) {
    if (!relatorios?.length) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p>Nenhum relatório disponível para visualização no momento.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {relatorios.map((rel: any) => (
                <Card key={rel.id} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4 border-b pb-4 dark:border-gray-700">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Relatório de Atendimento
                            </h4>
                            <div className="flex gap-4 mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    📅 {new Date(rel.agendamento?.data_hora_inicio || rel.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    👨‍⚕️ {rel.terapeuta?.nome_completo || 'Terapeuta'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-justify">
                            {rel.relatorio_gerado}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
