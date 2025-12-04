'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { generateBackup } from '@/lib/actions/backup'
import { format } from 'date-fns'

export default function BackupSection() {
    const [loading, setLoading] = useState(false)

    const handleBackup = async () => {
        setLoading(true)
        try {
            const result = await generateBackup()

            if (result.error) {
                alert('Erro ao gerar backup: ' + result.error)
                return
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.data, null, 2))
            const downloadAnchorNode = document.createElement('a')
            downloadAnchorNode.setAttribute("href", dataStr)
            downloadAnchorNode.setAttribute("download", `backup_tirilo_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`)
            document.body.appendChild(downloadAnchorNode)
            downloadAnchorNode.click()
            downloadAnchorNode.remove()

        } catch (error) {
            console.error(error)
            alert('Erro inesperado ao gerar backup')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Backup de Segurança
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Exporte todos os dados da sua clínica (pacientes, agenda, relatórios) para um arquivo JSON seguro.
                        Recomendamos fazer isso periodicamente para sua própria segurança.
                    </p>

                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4 mb-6 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Este arquivo contém dados sensíveis de pacientes. Armazene-o em local seguro e criptografado.
                        </p>
                    </div>

                    <Button
                        onClick={handleBackup}
                        disabled={loading}
                        className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando Arquivo...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Fazer Backup Completo
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
