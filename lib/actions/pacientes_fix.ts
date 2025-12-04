'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function togglePacienteTerapeuta(pacienteId: number, terapeutaId: string, shouldLink: boolean) {
    const supabase = await createClient()

    if (shouldLink) {
        // Link (add)
        const { error } = await supabase
            .from('pacientes_terapeutas')
            .insert({
                paciente_id: pacienteId,
                terapeuta_id: terapeutaId,
            })

        if (error) {
            console.error('Erro ao vincular terapeuta:', error)
            throw new Error('Erro ao vincular terapeuta')
        }
    } else {
        // Unlink (remove)
        const { error } = await supabase
            .from('pacientes_terapeutas')
            .delete()
            .eq('paciente_id', pacienteId)
            .eq('terapeuta_id', terapeutaId)

        if (error) {
            console.error('Erro ao desvincular terapeuta:', error)
            throw new Error('Erro ao desvincular terapeuta')
        }
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}

export async function updateResponsavel(pacienteId: number, responsavelId: number, responsavelData: {
    nome: string
    cpf: string
    whatsapp: string
    email?: string
    grau_parentesco: string
    responsavel_principal: boolean
}) {
    const supabase = await createClient()

    // 1. Update Responsavel Data
    const { error: respError } = await supabase
        .from('responsaveis')
        .update({
            nome: responsavelData.nome,
            cpf: responsavelData.cpf,
            whatsapp: responsavelData.whatsapp,
            email: responsavelData.email || null,
        })
        .eq('id', responsavelId)

    if (respError) {
        console.error('Erro ao atualizar responsável:', respError)
        throw new Error('Erro ao atualizar responsável')
    }

    // 2. Update Relationship Data
    const { error: relError } = await supabase
        .from('pacientes_responsaveis')
        .update({
            grau_parentesco: responsavelData.grau_parentesco,
            responsavel_principal: responsavelData.responsavel_principal,
        })
        .eq('paciente_id', pacienteId)
        .eq('responsavel_id', responsavelId)

    if (relError) {
        console.error('Erro ao atualizar vínculo do responsável:', relError)
        throw new Error('Erro ao atualizar vínculo do responsável')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}
