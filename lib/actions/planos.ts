'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_MODEL_VERSION } from '@/lib/constants/ai_models'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function extractPlanoFromImage(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('Arquivo não fornecido')

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_VERSION })

    const prompt = `Analise esta imagem de um plano de intervenção ou relatório terapêutico.
    Extraia o TÍTULO (ou sugira um baseada no conteúdo, ex: "Plano Terapêutico Inicial"), a DATA de criação e o TEXTO COMPLETO do plano.
    Retorne um JSON estritamente válido:
    {
        "titulo": "Título do Plano",
        "data_criacao": "YYYY-MM-DD" (se não encontrar, null com formato YYYY-MM-DD),
        "conteudo": "Texto completo formatado e estruturado."
    }`

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])
        const response = await result.response
        const text = response.text()
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(cleanText)
    } catch (e: any) {
        console.error('Erro na extração IA:', e)
        throw new Error('Falha ao processar imagem: ' + e.message)
    }
}

export async function importarPlanoLegado(data: {
    pacienteId: number
    titulo: string
    dataCriacao: string
    texto: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
        .from('planos_intervencao_ia')
        .insert({
            id_paciente: data.pacienteId,
            id_terapeuta: user.id,
            titulo: data.titulo,
            plano_final: data.texto,
            plano_original: 'Importado de arquivo físico/legado via IA',
            modelo_ia: 'Importado (Gemini 2.5)',
            created_at: data.dataCriacao ? `${data.dataCriacao}T12:00:00` : new Date().toISOString()
        })

    if (error) {
        console.error('Erro ao importar plano:', error)
        throw new Error('Erro ao salvar plano (Verifique se a migração SQL foi aplicada): ' + error.message)
    }

    revalidatePath(`/admin/pacientes/${data.pacienteId}`)
    return { success: true }
}

export async function deletePlanoIA(id: number, pacienteId: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('planos_intervencao_ia')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar:', error)
        throw new Error('Erro ao excluir plano')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
    return { success: true }
}

export async function updatePlanoIA(id: number, texto: string, pacienteId: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('planos_intervencao_ia')
        .update({ plano_final: texto })
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar plano:', error)
        throw new Error('Erro ao atualizar plano')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
    return { success: true }
}
