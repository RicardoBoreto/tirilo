'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Database } from '@/types/database.types'
import { uploadLogo } from '@/lib/actions/clinicas'

type Clinica = Database['public']['Tables']['saas_clinicas']['Row']



const clinicaSchema = z.object({
    razao_social: z.string().min(1, 'Razão social é obrigatória'),
    nome_fantasia: z.string().optional(),
    cnpj: z.string().optional(),
    logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
    status_assinatura: z.enum(['ativo', 'inativo', 'suspenso']),
    config_cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
    plano_atual: z.enum(['basico', 'profissional', 'empresarial']),
    max_terapeutas: z.number().min(1, 'Mínimo de 1 terapeuta'),
})

export default function EditClinicaForm({ clinica }: { clinica: Clinica }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        razao_social: clinica.razao_social,
        nome_fantasia: clinica.nome_fantasia || '',
        cnpj: clinica.cnpj || '',
        logo_url: clinica.logo_url || '',
        status_assinatura: clinica.status_assinatura,
        config_cor_primaria: clinica.config_cor_primaria,
        plano_atual: clinica.plano_atual,
        max_terapeutas: clinica.max_terapeutas || 5,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const validatedData = clinicaSchema.parse(formData)

            const { error } = await supabase
                .from('saas_clinicas')
                .update({
                    razao_social: validatedData.razao_social,
                    nome_fantasia: validatedData.nome_fantasia || null,
                    cnpj: validatedData.cnpj || null,
                    logo_url: validatedData.logo_url || null,
                    status_assinatura: validatedData.status_assinatura,
                    config_cor_primaria: validatedData.config_cor_primaria,
                    plano_atual: validatedData.plano_atual,
                    max_terapeutas: validatedData.max_terapeutas,
                })
                .eq('id', clinica.id)

            if (error) throw error

            router.push(`/admin/clinicas/${clinica.id}`)
            router.refresh()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {}
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as string] = err.message
                    }
                })
                setErrors(fieldErrors)
            } else {
                console.error('Error updating clinica:', JSON.stringify(error, null, 2))
                alert(`Erro ao atualizar clínica: ${JSON.stringify(error)}`)
            }
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta clínica? Esta ação não pode ser desfeita.')) {
            return
        }

        setLoading(true)

        const { error } = await supabase.from('saas_clinicas').delete().eq('id', clinica.id)

        if (error) {
            console.error('Error deleting clinica:', error)
            alert('Erro ao excluir clínica.')
            setLoading(false)
        } else {
            router.push('/admin/clinicas')
            router.refresh()
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-2 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Editar Clínica
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    ID: #{clinica.id}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="razao_social" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Razão Social *
                        </label>
                        <input
                            id="razao_social"
                            type="text"
                            value={formData.razao_social}
                            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.razao_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        {errors.razao_social && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.razao_social}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="nome_fantasia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome Fantasia
                        </label>
                        <input
                            id="nome_fantasia"
                            type="text"
                            value={formData.nome_fantasia}
                            onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CNPJ
                        </label>
                        <input
                            id="cnpj"
                            type="text"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Logo da Clínica
                        </label>
                        <div className="flex items-center gap-6">
                            {formData.logo_url && (
                                <div className="w-24 h-24 relative rounded-lg border border-gray-200 overflow-hidden bg-white">
                                    <img
                                        src={formData.logo_url}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setLoading(true)
                                            try {
                                                const uploadFormData = new FormData()
                                                uploadFormData.append('file', file)
                                                uploadFormData.append('clinica_id', clinica.id.toString())

                                                const url = await uploadLogo(uploadFormData)
                                                setFormData(prev => ({ ...prev, logo_url: url }))
                                            } catch (err) {
                                                console.error('Erro upload:', err)
                                                alert('Erro ao fazer upload do logo')
                                            } finally {
                                                setLoading(false)
                                            }
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="mt-1 text-xs text-gray-500">PNG, JPG ou SVG (max. 2MB)</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="plano_atual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Plano *
                        </label>
                        <select
                            id="plano_atual"
                            value={formData.plano_atual}
                            onChange={(e) => setFormData({ ...formData, plano_atual: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="basico">Básico</option>
                            <option value="profissional">Profissional</option>
                            <option value="empresarial">Empresarial</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="status_assinatura" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status *
                        </label>
                        <select
                            id="status_assinatura"
                            value={formData.status_assinatura}
                            onChange={(e) => setFormData({ ...formData, status_assinatura: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="suspenso">Suspenso</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="config_cor_primaria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cor Primária *
                        </label>
                        <div className="flex gap-3">
                            <input
                                id="config_cor_primaria"
                                type="color"
                                value={formData.config_cor_primaria}
                                onChange={(e) => setFormData({ ...formData, config_cor_primaria: e.target.value })}
                                className="h-12 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.config_cor_primaria}
                                onChange={(e) => setFormData({ ...formData, config_cor_primaria: e.target.value })}
                                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.config_cor_primaria ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="#3b82f6"
                            />
                        </div>
                        {errors.config_cor_primaria && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.config_cor_primaria}</p>
                        )}
                        {errors.config_cor_primaria && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.config_cor_primaria}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="max_terapeutas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Máximo de Terapeutas
                        </label>
                        <input
                            id="max_terapeutas"
                            type="number"
                            min="1"
                            value={formData.max_terapeutas}
                            onChange={(e) => setFormData({ ...formData, max_terapeutas: parseInt(e.target.value) || 5 })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Limite de licenças para terapeutas nesta clínica.</p>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="ml-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Excluir Clínica
                    </button>
                </div>
            </form>
        </div>
    )
}
