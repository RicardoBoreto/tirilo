'use client'

import { useState } from 'react'
import { updateSaasEmpresa, uploadSaasLogo } from '@/lib/actions/saas-config'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Building2, MapPin, Phone, Globe } from 'lucide-react'

export default function ConfigSaasForm({ initialData }: { initialData: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.logo_url)
    const [formData, setFormData] = useState({
        razao_social: initialData?.razao_social || '',
        nome_fantasia: initialData?.nome_fantasia || '',
        cnpj: initialData?.cnpj || '',
        inscricao_estadual: initialData?.inscricao_estadual || '',
        inscricao_municipal: initialData?.inscricao_municipal || '',
        end_cep: initialData?.end_cep || '',
        end_logradouro: initialData?.end_logradouro || '',
        end_numero: initialData?.end_numero || '',
        end_complemento: initialData?.end_complemento || '',
        end_bairro: initialData?.end_bairro || '',
        end_cidade: initialData?.end_cidade || '',
        end_estado: initialData?.end_estado || '',
        telefone: initialData?.telefone || '',
        email_contato: initialData?.email_contato || '',
        site_url: initialData?.site_url || '',
        logo_url: initialData?.logo_url || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value || '')
            })

            await updateSaasEmpresa(data)
            alert('Configurações salvas com sucesso!')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            alert(`Erro ao salvar: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Local preview
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)

        try {
            setLoading(true)
            const uploadData = new FormData()
            uploadData.append('file', file)
            const url = await uploadSaasLogo(uploadData)
            setFormData(prev => ({ ...prev, logo_url: url }))
        } catch (error) {
            alert('Erro ao fazer upload da imagem')
            setPreviewUrl(initialData?.logo_url) // Revert on error
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-800">
                <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
                            <CardDescription>Informações legais da empresa SaaS para emissão de notas fiscais.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Section */}
                    <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-white flex items-center justify-center group hover:border-primary/50 transition-colors">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Logo Preview"
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <span className="text-gray-400 text-xs font-medium text-center px-1">Logo da Empresa</span>
                            )}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                            <Label htmlFor="logo-upload" className="font-semibold">Logo da Empresa</Label>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <Label
                                    htmlFor="logo-upload"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Alterar Logo
                                </Label>
                            </div>
                            <p className="text-xs text-muted-foreground">Exibido em faturas e cabeçalhos de relatórios administrativos.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="razao_social">Razão Social *</Label>
                        <Input
                            id="razao_social"
                            required
                            value={formData.razao_social}
                            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                            className="mt-1.5"
                            placeholder="Ex: SaaS Tecnologia Ltda"
                        />
                    </div>
                    <div>
                        <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                        <Input
                            id="nome_fantasia"
                            value={formData.nome_fantasia}
                            onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                            className="mt-1.5"
                            placeholder="Ex: Tirilo"
                        />
                    </div>
                    <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                            className="mt-1.5"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>
                    <div>
                        <Label htmlFor="inscricao_estadual">Inscrição Estadual (IE)</Label>
                        <Input
                            id="inscricao_estadual"
                            value={formData.inscricao_estadual}
                            onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                            className="mt-1.5"
                            placeholder="Isento ou número"
                        />
                    </div>
                    <div>
                        <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                        <Input
                            id="inscricao_municipal"
                            value={formData.inscricao_municipal}
                            onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-800">
                <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Endereço</CardTitle>
                            <CardDescription>Localização da sede da empresa.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="end_cep">CEP</Label>
                        <Input
                            id="end_cep"
                            value={formData.end_cep}
                            onChange={(e) => setFormData({ ...formData, end_cep: e.target.value })}
                            className="mt-1.5"
                            placeholder="00000-000"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Label htmlFor="end_logradouro">Logradouro</Label>
                        <Input
                            id="end_logradouro"
                            value={formData.end_logradouro}
                            onChange={(e) => setFormData({ ...formData, end_logradouro: e.target.value })}
                            className="mt-1.5"
                            placeholder="Rua, Avenida..."
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Label htmlFor="end_numero">Número</Label>
                        <Input
                            id="end_numero"
                            value={formData.end_numero}
                            onChange={(e) => setFormData({ ...formData, end_numero: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="end_complemento">Complemento</Label>
                        <Input
                            id="end_complemento"
                            value={formData.end_complemento}
                            onChange={(e) => setFormData({ ...formData, end_complemento: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="end_bairro">Bairro</Label>
                        <Input
                            id="end_bairro"
                            value={formData.end_bairro}
                            onChange={(e) => setFormData({ ...formData, end_bairro: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Label htmlFor="end_cidade">Cidade</Label>
                        <Input
                            id="end_cidade"
                            value={formData.end_cidade}
                            onChange={(e) => setFormData({ ...formData, end_cidade: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Label htmlFor="end_estado">Estado (UF)</Label>
                        <Input
                            id="end_estado"
                            maxLength={2}
                            value={formData.end_estado}
                            onChange={(e) => setFormData({ ...formData, end_estado: e.target.value })}
                            className="mt-1.5"
                            placeholder="UF"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-800">
                <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Contato</CardTitle>
                            <CardDescription>Canais de comunicação.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="email_contato">Email de Contato</Label>
                        <Input
                            type="email"
                            id="email_contato"
                            value={formData.email_contato}
                            onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                            className="mt-1.5"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="site_url">Site URL</Label>
                        <div className="relative mt-1.5">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                id="site_url"
                                type="url"
                                className="pl-9"
                                value={formData.site_url}
                                onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                                placeholder="https://"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full sm:w-auto shadow-lg shadow-blue-500/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                        </>
                    ) : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    )
}
