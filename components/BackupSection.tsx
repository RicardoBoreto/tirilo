'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { generateBackup } from '@/lib/actions/backup'
import { syncToStaging, setEnvironment, getEnvironment } from '@/lib/actions/sync'
import { format } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BackupSection() {
    const [loading, setLoading] = useState(false)
    const [isStaging, setIsStaging] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function loadEnv() {
            const env = await getEnvironment()
            setIsStaging(env === 'staging')
        }
        loadEnv()
    }, [])

    const handleEnvToggle = async (checked: boolean) => {
        setLoading(true)
        try {
            await setEnvironment(checked ? 'staging' : 'prod')
            setIsStaging(checked)
            // Reload to refresh all clients
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert('Erro ao mudar ambiente')
        } finally {
            setLoading(false)
        }
    }

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

    const handleSync = async () => {
        if (!confirm("ATENÇÃO: Isso apagará TODOS os dados no ambiente de Staging (Teste) e substituirá pelos dados de produção. Deseja continuar?")) return

        setLoading(true)
        try {
            const result = await syncToStaging()
            if (result.error) {
                alert('Erro na sincronização: ' + result.error)
            } else {
                alert(result.message || 'Sincronização concluída!')
            }
        } catch (error) {
            console.error(error)
            alert('Erro inesperado ao sincronizar')
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
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Backup de Segurança
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Exporte todos os dados da sua clínica (pacientes, agenda, relatórios) para um arquivo JSON seguro.
                            Recomendamos fazer isso periodicamente para sua própria segurança.
                        </p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Este arquivo contém dados sensíveis de pacientes. Armazene-o em local seguro e criptografado.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 p-6 border border-blue-100 dark:border-blue-900/30 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Ambiente de Operação</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isStaging ? 'Operando sobre o banco de TESTES' : 'Operando sobre o banco de PRODUÇÃO'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                <Label htmlFor="env-mode" className={`text-xs font-bold ${!isStaging ? 'text-blue-600' : 'text-gray-400'}`}>PROD</Label>
                                <Switch
                                    id="env-mode"
                                    checked={isStaging}
                                    onCheckedChange={handleEnvToggle}
                                    disabled={loading}
                                />
                                <Label htmlFor="env-mode" className={`text-xs font-bold ${isStaging ? 'text-amber-500' : 'text-gray-400'}`}>STAGING</Label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleBackup}
                                disabled={loading || isStaging}
                                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                                Fazer Backup Completo
                            </Button>

                            <Button
                                onClick={handleSync}
                                disabled={loading || isStaging}
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                            >
                                <ShieldCheck className="w-5 h-5 mr-2" />
                                Clonar Banco para Staging
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
