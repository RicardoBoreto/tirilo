'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_MODEL_VERSION } from '@/lib/constants/ai_models'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function analyzeMaterialImage(formData: FormData) {
    const file = formData.get('file') as File
    const imageUrl = formData.get('imageUrl') as string

    let base64Data = ''
    let mimeType = ''

    if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer()
        base64Data = Buffer.from(arrayBuffer).toString('base64')
        mimeType = file.type
    } else if (imageUrl) {
        try {
            const resp = await fetch(imageUrl)
            if (!resp.ok) throw new Error('Falha ao baixar imagem da URL')
            const arrayBuffer = await resp.arrayBuffer()
            base64Data = Buffer.from(arrayBuffer).toString('base64')
            mimeType = resp.headers.get('content-type') || 'image/jpeg'
        } catch (e: any) {
            throw new Error('Erro ao processar URL da imagem: ' + e.message)
        }
    } else {
        throw new Error('Arquivo ou URL não fornecido')
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_VERSION })

    const prompt = `Analise esta imagem de um material terapêutico ou brinquedo usado em clínicas de terapia infantil (ABA/Denver).
    
    Identifique:
    1. O NOME provável do item.
    2. Liste de 3 a 5 OBJETIVOS TERAPÊUTICOS que podem ser trabalhados com este recurso, focando em habilidades cognitivas, motoras, sociais ou de comunicação.
    3. Uma BREVE DESCRIÇÃO (máximo 2 frases) explicando o que é o item e para que serve.

    Retorne APENAS um JSON válido no seguinte formato:
    {
        "nome": "Nome do Material",
        "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
        "descricao": "Descrição curta do item."
    }`

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ])
        const response = await result.response
        const text = response.text()
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            return JSON.parse(cleanText)
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON da IA:', text)
            // Fallback simples se o JSON falhar, tenta extrair algo
            throw new Error('A IA não retornou um formato válido. Tente outra foto.')
        }

    } catch (e: any) {
        console.error('Erro na análise de material IA:', e)
        throw new Error('Falha ao analisar imagem: ' + e.message)
    }
}
