'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clonePrompt(originalPromptId: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // 1. Fetch Original Prompt
    const { data: originalPrompt, error: fetchError } = await supabase
        .from('prompts_ia')
        .select('*')
        .eq('id', originalPromptId)
        .single()

    if (fetchError || !originalPrompt) {
        return { success: false, error: 'Prompt original não encontrado' }
    }

    // 2. Create New Prompt Data
    const newPromptData = {
        id_clinica: originalPrompt.id_clinica,
        terapeuta_id: user.id, // Assign to current user
        nome_prompt: `Cópia de ${originalPrompt.nome_prompt}`,
        descricao: originalPrompt.descricao,
        prompt_texto: originalPrompt.prompt_texto,
        modelo_gemini: originalPrompt.modelo_gemini,
        temperatura: originalPrompt.temperatura,
        ativo: true,
        criado_por: user.id
    }

    // 3. Insert New Prompt
    const { error: insertError } = await supabase
        .from('prompts_ia')
        .insert(newPromptData)

    if (insertError) {
        console.error('Erro ao clonar prompt:', insertError)
        return { success: false, error: insertError.message }
    }

    revalidatePath('/admin/prompts-ia')
    return { success: true }
}
