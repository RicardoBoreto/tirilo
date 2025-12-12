'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

const clinicaSchema = z.object({
    razao_social: z.string().min(1, 'Razão social é obrigatória'),
    nome_fantasia: z.string().optional(),
    cnpj: z.string().optional(),
    inscricao_estadual: z.string().optional(),
    missao: z.string().optional(),
    end_cep: z.string().optional(),
    end_logradouro: z.string().optional(),
    end_numero: z.string().optional(),
    end_complemento: z.string().optional(),
    end_bairro: z.string().optional(),
    end_cidade: z.string().optional(),
    end_estado: z.string().optional(),
    logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
    status_assinatura: z.enum(['ativo', 'inativo', 'suspenso']),
    config_cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
    plano_atual: z.enum(['basico', 'profissional', 'empresarial']),
})

export default function NovaClinicaPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        inscricao_estadual: '',
        missao: '',
        end_cep: '',
        end_logradouro: '',
        end_numero: '',
        end_complemento: '',
        end_bairro: '',
        end_cidade: '',
        end_estado: '',
        logo_url: '',
        status_assinatura: 'ativo',
        config_cor_primaria: '#3b82f6',
        plano_atual: 'basico',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const validatedData = clinicaSchema.parse(formData)

            const { error } = await supabase.from('saas_clinicas').insert([
                {
                    razao_social: validatedData.razao_social,
                    nome_fantasia: validatedData.nome_fantasia || null,
                    cnpj: validatedData.cnpj || null,
                    inscricao_estadual: validatedData.inscricao_estadual || null,
                    missao: validatedData.missao || null,
                    end_cep: validatedData.end_cep || null,
                    end_logradouro: validatedData.end_logradouro || null,
                    end_numero: validatedData.end_numero || null,
                    end_complemento: validatedData.end_complemento || null,
                    end_bairro: validatedData.end_bairro || null,
                    end_cidade: validatedData.end_cidade || null,
                    end_estado: validatedData.end_estado || null,
                    logo_url: validatedData.logo_url || null,
                    status_assinatura: validatedData.status_assinatura,
                    config_cor_primaria: validatedData.config_cor_primaria,
                    plano_atual: validatedData.plano_atual,
                },
            ])

            if (error) throw error

            router.push('/admin/clinicas')
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
                console.error('Error creating clinica:', error)
                alert('Erro ao criar clínica. Verifique os dados e tente novamente.')
            }
            setLoading(false)
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
                    Nova Clínica
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Cadastre uma nova clínica no sistema
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label htmlFor="inscricao_estadual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Inscrição Estadual
                            </label>
                            <input
                                id="inscricao_estadual"
                                type="text"
                                value={formData.inscricao_estadual}
                                onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Isento ou Número"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endereço</label>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="end_cep" className="text-xs text-gray-500 mb-1 block">CEP</label>
                                <input
                                    id="end_cep"
                                    type="text"
                                    value={formData.end_cep}
                                    onChange={(e) => setFormData({ ...formData, end_cep: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="end_logradouro" className="text-xs text-gray-500 mb-1 block">Logradouro</label>
                                <input
                                    id="end_logradouro"
                                    type="text"
                                    value={formData.end_logradouro}
                                    onChange={(e) => setFormData({ ...formData, end_logradouro: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Rua, Av..."
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="end_numero" className="text-xs text-gray-500 mb-1 block">Número</label>
                                <input
                                    id="end_numero"
                                    type="text"
                                    value={formData.end_numero}
                                    onChange={(e) => setFormData({ ...formData, end_numero: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="123"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="end_complemento" className="text-xs text-gray-500 mb-1 block">Complemento</label>
                                <input
                                    id="end_complemento"
                                    type="text"
                                    value={formData.end_complemento}
                                    onChange={(e) => setFormData({ ...formData, end_complemento: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Ap 101"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="end_bairro" className="text-xs text-gray-500 mb-1 block">Bairro</label>
                                <input
                                    id="end_bairro"
                                    type="text"
                                    value={formData.end_bairro}
                                    onChange={(e) => setFormData({ ...formData, end_bairro: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Bairro"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label htmlFor="end_cidade" className="text-xs text-gray-500 mb-1 block">Cidade</label>
                                <input
                                    id="end_cidade"
                                    type="text"
                                    value={formData.end_cidade}
                                    onChange={(e) => setFormData({ ...formData, end_cidade: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Cidade"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="end_estado" className="text-xs text-gray-500 mb-1 block">Estado</label>
                                <input
                                    id="end_estado"
                                    type="text"
                                    value={formData.end_estado}
                                    onChange={(e) => setFormData({ ...formData, end_estado: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="UF"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="missao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Missão
                        </label>
                        <textarea
                            id="missao"
                            rows={3}
                            value={formData.missao}
                            onChange={(e) => setFormData({ ...formData, missao: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Missão e valores da clínica..."
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL do Logo
                        </label>
                        <input
                            id="logo_url"
                            type="url"
                            value={formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.logo_url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="https://exemplo.com/logo.png"
                        />
                        {errors.logo_url && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logo_url}</p>
                        )}
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
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Salvando...' : 'Salvar Clínica'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    )
}
