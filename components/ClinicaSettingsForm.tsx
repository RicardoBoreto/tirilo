'use client'

import { updateClinica } from '@/lib/actions/clinica'
import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'

export default function ClinicaSettingsForm({ clinic }: { clinic: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(clinic?.logo_url)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            await updateClinica(formData)
            alert('Configurações salvas com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar configurações.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    return (
        <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-8">
                <form action={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="md:col-span-2 space-y-4">
                            <Label className="text-base font-semibold">Logo da Clínica</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center group hover:border-primary/50 transition-colors">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Logo Preview"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-xs font-medium">Sem logo</span>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            name="logo"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <Label
                                            htmlFor="logo-upload"
                                            className="flex items-center justify-center w-full sm:w-auto px-6 py-3 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                                        >
                                            <Upload className="w-5 h-5 mr-2 text-gray-400 group-hover:text-primary" />
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-primary">
                                                Escolher nova imagem
                                            </span>
                                        </Label>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Recomendado: PNG ou JPG, max 2MB.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                            <Input
                                type="text"
                                name="nome_fantasia"
                                id="nome_fantasia"
                                defaultValue={clinic?.nome_fantasia || ''}
                                required
                                placeholder="Ex: Clínica Tirilo"
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="razao_social">Razão Social</Label>
                            <Input
                                type="text"
                                name="razao_social"
                                id="razao_social"
                                defaultValue={clinic?.razao_social || ''}
                                required
                                placeholder="Ex: Tirilo Serviços Ltda"
                                className="h-12"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="config_cor_primaria">Cor da Marca</Label>
                            <div className="flex items-center gap-4 p-4 border rounded-2xl bg-gray-50/50">
                                <div className="relative">
                                    <input
                                        type="color"
                                        name="config_cor_primaria"
                                        id="config_cor_primaria"
                                        defaultValue={clinic?.config_cor_primaria || '#3b82f6'}
                                        className="h-12 w-12 p-1 border-none rounded-xl cursor-pointer bg-transparent"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Cor Primária
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Esta cor será usada em botões, links e destaques da sua área.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            size="lg"
                            className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Configurações'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
