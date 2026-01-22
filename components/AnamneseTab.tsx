'use client'

import { useState } from 'react'
import { saveAnamnese, uploadLaudo, getLaudoSignedUrl, extractAnamneseFromImage, type Anamnese } from '@/lib/actions/pacientes'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { Loader2, Upload, FileText, Music, Activity, Printer, Sparkles } from 'lucide-react'

type Props = {
    pacienteId: number
    anamnese: Anamnese | null
    pacienteNome: string
    clinicLogo?: string | null
    clinicName?: string | null
}

export default function AnamneseTab({ pacienteId, anamnese, pacienteNome, clinicLogo, clinicName }: Props) {
    const router = useRouter()
    const [activeSubTab, setActiveSubTab] = useState<'desenvolvimento' | 'laudo' | 'musicoterapia'>('desenvolvimento')
    const [loading, setLoading] = useState(false)
    const [uploadingLaudo, setUploadingLaudo] = useState(false)
    const [importingAI, setImportingAI] = useState(false) // New state


    // ... existing states ...
    const [formData, setFormData] = useState({
        gestacao_intercorrencias: anamnese?.gestacao_intercorrencias || '',
        parto_tipo: anamnese?.parto_tipo || '',
        desenvolvimento_motor: anamnese?.desenvolvimento_motor || '',
        desenvolvimento_linguagem: anamnese?.desenvolvimento_linguagem || '',
        historico_medico: anamnese?.historico_medico || '',
        medicamentos_atuais: anamnese?.medicamentos_atuais || '',
        alergias: anamnese?.alergias || '',
        diagnostico_principal: anamnese?.diagnostico_principal || '',
    })

    const [musicoterapiaData, setMusicoterapiaData] = useState({
        musicas_favoritas: anamnese?.musicoterapia?.musicas_favoritas || '',
        musicas_reforcadoras: anamnese?.musicoterapia?.musicas_reforcadoras || '',
        musicas_rejeitadas: anamnese?.musicoterapia?.musicas_rejeitadas || '',
        instrumentos_preferidos: anamnese?.musicoterapia?.instrumentos_preferidos || '',
        reacoes_musicais: anamnese?.musicoterapia?.reacoes_musicais || '',
        objetivos_terapeuticos: anamnese?.musicoterapia?.objetivos_terapeuticos || '',
    })



    async function handleImportFromAI(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm('Isso irá substituir os campos atuais pelos dados extraídos da imagem. Deseja continuar?')) {
            e.target.value = '' // Reset input
            return
        }

        setImportingAI(true)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const extractedData = await extractAnamneseFromImage(formDataUpload)

            // Merge extracted data into form state
            setFormData(prev => ({
                ...prev,
                gestacao_intercorrencias: extractedData.gestacao_intercorrencias || prev.gestacao_intercorrencias,
                parto_tipo: extractedData.parto_tipo || prev.parto_tipo,
                desenvolvimento_motor: extractedData.desenvolvimento_motor || prev.desenvolvimento_motor,
                desenvolvimento_linguagem: extractedData.desenvolvimento_linguagem || prev.desenvolvimento_linguagem,
                historico_medico: extractedData.historico_medico || prev.historico_medico,
                medicamentos_atuais: extractedData.medicamentos_atuais || prev.medicamentos_atuais,
                alergias: extractedData.alergias || prev.alergias,
                diagnostico_principal: extractedData.diagnostico_principal || prev.diagnostico_principal,
            }))

            alert('Dados extraídos com sucesso! Por favor, revise e salve.')
            setActiveSubTab('desenvolvimento') // Switch to main tab to see changes
        } catch (error) {
            console.error('Erro na importação IA:', error)
            alert('Erro ao processar imagem. Tente novamente com uma foto mais nítida.')
        } finally {
            setImportingAI(false)
            e.target.value = ''
        }
    }

    // ... existing functions ...
    async function handleSaveDesenvolvimento() {
        setLoading(true)
        try {
            await saveAnamnese(pacienteId, formData)
            router.refresh()

        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar dados')
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveMusicoterapia() {
        setLoading(true)
        try {
            await saveAnamnese(pacienteId, {
                musicoterapia: musicoterapiaData,
            })
            router.refresh()

        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar dados')
        } finally {
            setLoading(false)
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Apenas arquivos PDF são permitidos')
            return
        }

        setUploadingLaudo(true)
        try {
            const formData = new FormData()
            formData.append('paciente_id', pacienteId.toString())
            formData.append('file', file)

            await uploadLaudo(formData)
            router.refresh()

        } catch (error) {
            console.error('Erro ao enviar laudo:', error)
            alert('Erro ao enviar laudo')
        } finally {
            setUploadingLaudo(false)
        }
    }

    async function handleViewLaudo() {
        if (!anamnese?.laudo_medico_arquivo_url) return

        try {
            const signedUrl = await getLaudoSignedUrl(anamnese.laudo_medico_arquivo_url)
            window.open(signedUrl, '_blank')
        } catch (error) {
            console.error('Erro ao abrir laudo:', error)
            alert('Erro ao abrir laudo')
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const fields = [
            { label: 'Diagnóstico Principal', value: formData.diagnostico_principal },
            { label: 'Intercorrências na Gestação', value: formData.gestacao_intercorrencias },
            { label: 'Tipo de Parto', value: formData.parto_tipo },
            { label: 'Desenvolvimento Motor', value: formData.desenvolvimento_motor },
            { label: 'Desenvolvimento da Linguagem', value: formData.desenvolvimento_linguagem },
            { label: 'Histórico Médico', value: formData.historico_medico },
            { label: 'Medicamentos Atuais', value: formData.medicamentos_atuais },
            { label: 'Alergias', value: formData.alergias },
        ]

        const musicFields = [
            { label: 'Músicas Favoritas', value: musicoterapiaData.musicas_favoritas },
            { label: 'Músicas Reforçadoras', value: musicoterapiaData.musicas_reforcadoras },
            { label: 'Músicas Rejeitadas', value: musicoterapiaData.musicas_rejeitadas },
            { label: 'Instrumentos Preferidos', value: musicoterapiaData.instrumentos_preferidos },
            { label: 'Reações Musicais', value: musicoterapiaData.reacoes_musicais },
            { label: 'Objetivos Terapêuticos', value: musicoterapiaData.objetivos_terapeuticos },
        ]

        const renderField = (label: string, value: string) => {
            if (!value) return ''
            return `
                <div class="field">
                    <div class="label">${label}</div>
                    <div class="value">${value.replace(/\n/g, '<br>')}</div>
                </div>
            `
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Anamnese - ${pacienteNome}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm;
                            @bottom-center {
                                content: "Página " counter(page) " de " counter(pages);
                                font-size: 10pt;
                                color: #666;
                            }
                        }
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header {
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            margin-bottom: 40px;
                            border-bottom: 2px solid #eee;
                            padding-bottom: 20px;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            object-fit: contain;
                        }
                        .clinic-info h1 {
                            margin: 0;
                            font-size: 24px;
                            color: #1a1a1a;
                        }
                        .clinic-info p {
                            margin: 5px 0 0;
                            color: #666;
                            font-size: 14px;
                        }
                        .patient-info {
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin-bottom: 30px;
                        }
                        .patient-info h2 {
                            margin: 0 0 10px;
                            font-size: 18px;
                            color: #2c3e50;
                        }
                        .section-title {
                            font-size: 16px;
                            font-weight: bold;
                            color: #fff;
                            background: #6366f1;
                            padding: 8px 15px;
                            border-radius: 6px;
                            margin: 30px 0 20px;
                            display: inline-block;
                        }
                        .field {
                            margin-bottom: 20px;
                            page-break-inside: avoid;
                        }
                        .label {
                            font-weight: bold;
                            font-size: 13px;
                            color: #666;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 5px;
                        }
                        .value {
                            font-size: 15px;
                            color: #1a1a1a;
                            white-space: pre-wrap;
                        }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${clinicLogo ? `<img src="${clinicLogo}" class="logo" alt="Logo" />` : ''}
                        <div class="clinic-info">
                            <h1>${clinicName || 'Clínica'}</h1>
                            <p>Ficha de Anamnese</p>
                        </div>
                    </div>

                    <div class="patient-info">
                        <h2>Paciente: ${pacienteNome}</h2>
                        <p>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>

                    ${fields.some(f => f.value) ? `
                        <div class="section-title">Histórico e Desenvolvimento</div>
                        ${fields.map(f => renderField(f.label, f.value)).join('')}
                    ` : ''}

                    ${musicFields.some(f => f.value) ? `
                        <div class="section-title">Musicoterapia</div>
                        ${musicFields.map(f => renderField(f.label, f.value)).join('')}
                    ` : ''}

                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const subTabs = [
        { id: 'desenvolvimento' as const, label: 'Desenvolvimento', icon: Activity },
        { id: 'laudo' as const, label: 'Laudo Médico', icon: FileText },
        { id: 'musicoterapia' as const, label: 'Musicoterapia', icon: Music },
    ]

    return (
        <div className="space-y-6 relative">


            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Anamnese Completa
                </h2>
                <div className="flex gap-2">
                    <label className="cursor-pointer">
                        <Button
                            variant="secondary"
                            className="gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                            disabled={importingAI}
                            asChild
                        >
                            <span>
                                {importingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Importar Foto (IA)
                            </span>
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleImportFromAI}
                            disabled={importingAI}
                        />
                    </label>

                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir Ficha
                    </Button>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl inline-flex">
                {subTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSubTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    {/* Desenvolvimento */}
                    {activeSubTab === 'desenvolvimento' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Intercorrências na Gestação</Label>
                                    <Textarea
                                        value={formData.gestacao_intercorrencias}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, gestacao_intercorrencias: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Descreva intercorrências..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Parto</Label>
                                    <select
                                        value={formData.parto_tipo}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, parto_tipo: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Cesárea">Cesárea</option>
                                        <option value="Fórceps">Fórceps</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Desenvolvimento Motor</Label>
                                    <Textarea
                                        value={formData.desenvolvimento_motor}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, desenvolvimento_motor: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Marcos do desenvolvimento..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Desenvolvimento da Linguagem</Label>
                                    <Textarea
                                        value={formData.desenvolvimento_linguagem}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, desenvolvimento_linguagem: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Fala e comunicação..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Histórico Médico</Label>
                                    <Textarea
                                        value={formData.historico_medico}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, historico_medico: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Doenças, cirurgias..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Medicamentos Atuais</Label>
                                    <Textarea
                                        value={formData.medicamentos_atuais}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, medicamentos_atuais: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Em uso..."
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label>Alergias</Label>
                                    <Textarea
                                        value={formData.alergias}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, alergias: e.target.value })}
                                        placeholder="Alergias conhecidas..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSaveDesenvolvimento}
                                    disabled={loading}
                                    size="lg"
                                    className="w-full md:w-auto rounded-2xl shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Desenvolvimento'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Laudo Médico */}
                    {activeSubTab === 'laudo' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Diagnóstico Principal</Label>
                                <Input
                                    type="text"
                                    value={formData.diagnostico_principal}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, diagnostico_principal: e.target.value })}
                                    placeholder="Ex: TEA, TDAH, etc."
                                    className="h-12"
                                />
                            </div>

                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-10 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="mt-4">
                                        <Label
                                            htmlFor="laudo-upload"
                                            className="cursor-pointer inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-medium"
                                        >
                                            {uploadingLaudo ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                'Selecionar Laudo (PDF)'
                                            )}
                                            <Input
                                                id="laudo-upload"
                                                type="file"
                                                accept="application/pdf"
                                                onChange={handleFileUpload}
                                                disabled={uploadingLaudo}
                                                className="hidden"
                                            />
                                        </Label>
                                    </div>
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        Apenas arquivos PDF são aceitos
                                    </p>
                                </div>
                            </div>

                            {anamnese?.laudo_medico_arquivo_url && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <FileText className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-green-900 dark:text-green-300">
                                                Laudo disponível
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                Enviado em {anamnese.laudo_medico_data_upload &&
                                                    new Date(anamnese.laudo_medico_data_upload).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleViewLaudo}
                                        variant="outline"
                                        className="border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                    >
                                        Visualizar
                                    </Button>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSaveDesenvolvimento}
                                    disabled={loading}
                                    size="lg"
                                    className="w-full md:w-auto rounded-2xl shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Diagnóstico'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Musicoterapia */}
                    {activeSubTab === 'musicoterapia' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Músicas Favoritas</Label>
                                    <Textarea
                                        value={musicoterapiaData.musicas_favoritas}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, musicas_favoritas: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Liste as músicas preferidas..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Músicas Reforçadoras</Label>
                                    <Textarea
                                        value={musicoterapiaData.musicas_reforcadoras}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, musicas_reforcadoras: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Músicas para reforço positivo..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Músicas Rejeitadas</Label>
                                    <Textarea
                                        value={musicoterapiaData.musicas_rejeitadas}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, musicas_rejeitadas: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Músicas que causam desconforto..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Instrumentos Preferidos</Label>
                                    <Textarea
                                        value={musicoterapiaData.instrumentos_preferidos}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, instrumentos_preferidos: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Instrumentos que o paciente gosta..."
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label>Reações Musicais</Label>
                                    <Textarea
                                        value={musicoterapiaData.reacoes_musicais}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, reacoes_musicais: e.target.value })}
                                        className="min-h-[100px]"
                                        placeholder="Reações gerais à música..."
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label>Objetivos Terapêuticos</Label>
                                    <Textarea
                                        value={musicoterapiaData.objetivos_terapeuticos}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicoterapiaData({ ...musicoterapiaData, objetivos_terapeuticos: e.target.value })}
                                        className="min-h-[120px]"
                                        placeholder="Objetivos a serem trabalhados..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSaveMusicoterapia}
                                    disabled={loading}
                                    size="lg"
                                    className="w-full md:w-auto rounded-2xl shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Musicoterapia'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
