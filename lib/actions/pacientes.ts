'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Paciente = {
    id: number
    created_at: string
    updated_at: string
    id_clinica: number
    nome: string
    data_nascimento: string
    foto_url: string | null
    observacoes: string | null
    ativo: boolean
}

export type Responsavel = {
    id: number
    created_at: string
    nome: string
    cpf: string
    whatsapp: string
    email: string | null
    user_id: string | null
}

export type PacienteResponsavel = {
    id: number
    paciente_id: number
    responsavel_id: number
    grau_parentesco: string
    responsavel_principal: boolean
    created_at: string
}

export type Anamnese = {
    id: number
    paciente_id: number
    created_at: string
    updated_at: string
    gestacao_intercorrencias: string | null
    parto_tipo: string | null
    desenvolvimento_motor: string | null
    desenvolvimento_linguagem: string | null
    historico_medico: string | null
    medicamentos_atuais: string | null
    alergias: string | null
    laudo_medico_arquivo_url: string | null
    laudo_medico_data_upload: string | null
    diagnostico_principal: string | null
    musicoterapia: any
}

export async function getPacientes(clinicaId?: number) {
    const supabase = await createClient()

    let query = supabase
        .from('pacientes')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })

    if (clinicaId) {
        query = query.eq('id_clinica', clinicaId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Erro ao buscar pacientes:', error)
        return []
    }

    return data as Paciente[]
}

export async function getPaciente(id: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Erro ao buscar paciente:', error)
        return null
    }

    return data as Paciente
}

export async function createPaciente(formData: FormData) {
    const supabase = await createClient()

    const pacienteData = {
        id_clinica: Number(formData.get('clinica_id')),
        nome: formData.get('nome') as string,
        data_nascimento: formData.get('data_nascimento') as string,
        foto_url: formData.get('foto_url') as string || null,
        observacoes: formData.get('observacoes') as string || null,
    }

    const { data, error } = await supabase
        .from('pacientes')
        .insert(pacienteData)
        .select()
        .single()

    if (error) {
        console.error('Erro ao criar paciente:', error)
        throw new Error('Erro ao criar paciente')
    }

    revalidatePath('/admin/pacientes')
    return data as Paciente
}

export async function updatePaciente(id: number, formData: FormData) {
    const supabase = await createClient()

    const pacienteData = {
        nome: formData.get('nome') as string,
        data_nascimento: formData.get('data_nascimento') as string,
        foto_url: formData.get('foto_url') as string || null,
        observacoes: formData.get('observacoes') as string || null,
    }

    const { data, error } = await supabase
        .from('pacientes')
        .update(pacienteData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Erro ao atualizar paciente:', error)
        throw new Error('Erro ao atualizar paciente')
    }

    revalidatePath('/admin/pacientes')
    revalidatePath(`/admin/pacientes/${id}`)
    return data as Paciente
}

export async function deletePaciente(id: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('pacientes')
        .update({ ativo: false })
        .eq('id', id)

    if (error) {
        console.error('Erro ao deletar paciente:', error)
        throw new Error('Erro ao deletar paciente')
    }

    revalidatePath('/admin/pacientes')
}

// ============================================
// RESPONSÁVEIS
// ============================================

export async function getResponsaveis(pacienteId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pacientes_responsaveis')
        .select(`
      *,
      responsavel:responsaveis(*)
    `)
        .eq('paciente_id', pacienteId)

    if (error) {
        console.error('Erro ao buscar responsáveis:', error)
        return []
    }

    return data
}

export async function addResponsavel(pacienteId: number, responsavelData: {
    nome: string
    cpf: string
    whatsapp: string
    email?: string
    grau_parentesco: string
    responsavel_principal: boolean
}) {
    const supabase = await createClient()

    // Primeiro, criar ou buscar o responsável
    const { data: existingResp } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('cpf', responsavelData.cpf)
        .single()

    let responsavelId: number

    if (existingResp) {
        responsavelId = existingResp.id
    } else {
        const { data: newResp, error: respError } = await supabase
            .from('responsaveis')
            .insert({
                nome: responsavelData.nome,
                cpf: responsavelData.cpf,
                whatsapp: responsavelData.whatsapp,
                email: responsavelData.email || null,
            })
            .select()
            .single()

        if (respError) {
            console.error('Erro ao criar responsável:', respError)
            throw new Error('Erro ao criar responsável')
        }

        responsavelId = newResp.id
    }

    // Agora, criar a relação
    const { error: relError } = await supabase
        .from('pacientes_responsaveis')
        .insert({
            paciente_id: pacienteId,
            responsavel_id: responsavelId,
            grau_parentesco: responsavelData.grau_parentesco,
            responsavel_principal: responsavelData.responsavel_principal,
        })

    if (relError) {
        console.error('Erro ao vincular responsável:', relError)
        throw new Error('Erro ao vincular responsável')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}

export async function removeResponsavel(pacienteId: number, responsavelId: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('pacientes_responsaveis')
        .delete()
        .eq('paciente_id', pacienteId)
        .eq('responsavel_id', responsavelId)

    if (error) {
        console.error('Erro ao remover responsável:', error)
        throw new Error('Erro ao remover responsável')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}

// ============================================
// ANAMNESE
// ============================================

export async function getAnamnese(pacienteId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pacientes_anamnese')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar anamnese:', error)
        return null
    }

    return data as Anamnese | null
}

export async function saveAnamnese(pacienteId: number, anamneseData: Partial<Anamnese>) {
    const supabase = await createClient()

    // Verificar se já existe anamnese
    const { data: existing } = await supabase
        .from('pacientes_anamnese')
        .select('id')
        .eq('paciente_id', pacienteId)
        .single()

    if (existing) {
        // Atualizar
        const { error } = await supabase
            .from('pacientes_anamnese')
            .update(anamneseData)
            .eq('paciente_id', pacienteId)

        if (error) {
            console.error('Erro ao atualizar anamnese:', error)
            throw new Error('Erro ao atualizar anamnese')
        }
    } else {
        // Criar
        const { error } = await supabase
            .from('pacientes_anamnese')
            .insert({
                paciente_id: pacienteId,
                ...anamneseData,
            })

        if (error) {
            console.error('Erro ao criar anamnese:', error)
            throw new Error('Erro ao criar anamnese')
        }
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}

export async function uploadLaudo(formData: FormData) {
    const supabase = await createClient()

    const pacienteId = Number(formData.get('paciente_id'))
    const file = formData.get('file') as File

    if (!file) {
        throw new Error('Nenhum arquivo foi enviado')
    }

    console.log('Upload iniciado:', {
        pacienteId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    })

    // Sanitizar nome do arquivo: remover espaços e caracteres especiais
    const sanitizedFileName = file.name
        .normalize('NFD') // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substituir caracteres especiais e espaços por underscore
        .replace(/_{2,}/g, '_') // Substituir múltiplos underscores por um único
        .toLowerCase() // Converter para minúsculas

    const fileName = `${pacienteId}/${Date.now()}_${sanitizedFileName}`

    console.log('Nome do arquivo sanitizado:', fileName)

    const { data, error } = await supabase.storage
        .from('laudos')
        .upload(fileName, file)

    if (error) {
        console.error('Erro detalhado ao fazer upload do laudo:', {
            error,
            message: error.message,
            statusCode: (error as any).statusCode,
            fileName,
        })
        throw new Error(`Erro ao fazer upload: ${error.message}`)
    }

    console.log('Upload bem-sucedido:', data)

    // Para bucket privado, salvamos apenas o path
    // A URL será gerada quando necessário com createSignedUrl
    const filePath = fileName

    console.log('Arquivo salvo em:', filePath)

    // Atualizar anamnese com o PATH do laudo (não a URL)
    await saveAnamnese(pacienteId, {
        laudo_medico_arquivo_url: filePath,
        laudo_medico_data_upload: new Date().toISOString(),
    })

    return filePath
}

// Função para gerar URL assinada (válida por 1 hora)
export async function getLaudoSignedUrl(filePath: string) {
    const supabase = await createClient()

    // Se o filePath for uma URL completa, extrair apenas o caminho
    // Ex: https://.../laudos/1/arquivo.pdf -> 1/arquivo.pdf
    let cleanPath = filePath
    if (filePath.startsWith('http')) {
        const parts = filePath.split('/laudos/')
        if (parts.length > 1) {
            cleanPath = parts[1]
        }
    }

    console.log('Gerando URL assinada para:', { original: filePath, clean: cleanPath })

    const { data, error } = await supabase.storage
        .from('laudos')
        .createSignedUrl(cleanPath, 3600) // 1 hora

    if (error) {
        console.error('Erro detalhado ao gerar URL assinada:', {
            error,
            message: error.message,
            path: cleanPath
        })
        throw new Error(`Erro ao gerar URL: ${error.message}`)
    }

    return data.signedUrl
}

export async function getPacientesTerapeutas(pacienteId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pacientes_terapeutas')
        .select('terapeuta_id')
        .eq('paciente_id', pacienteId)

    if (error) {
        console.error('Erro ao buscar terapeutas do paciente:', error)
        return []
    }

    return data.map(item => item.terapeuta_id)
}

export async function uploadFotoPaciente(pacienteId: number, file: File) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `pacientes/${pacienteId}-${Date.now()}.${fileExt}`

    // Upload do arquivo
    const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        })

    if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError)
        return { error: 'Erro ao fazer upload da foto' }
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)

    // Atualizar paciente com a URL da foto
    const { error: updateError } = await supabase
        .from('pacientes')
        .update({ foto_url: publicUrl })
        .eq('id', pacienteId)

    if (updateError) {
        console.error('Erro ao atualizar paciente:', updateError)
        return { error: 'Erro ao atualizar paciente com a foto' }
    }

    revalidatePath('/admin/pacientes')
    revalidatePath(`/admin/pacientes/${pacienteId}`)
    return { success: true, url: publicUrl }
}
