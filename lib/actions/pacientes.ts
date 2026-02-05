'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'
import { GEMINI_MODEL_VERSION } from '@/lib/constants/ai_models'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function extractAnamneseFromImage(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('Arquivo não fornecido')

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_VERSION })

    const prompt = `Analise esta imagem de uma ficha de anamnese ou laudo médico manuscrito ou impresso.
    Sua missão é extrair os dados clínicos para preenchimento de prontuário.
    Retorne APENAS um objeto JSON estritamente válido (sem markdown, sem code block) com as chaves exatas abaixo.
    Se a informação não constar, preencha com string vazia "".
    
    Chaves requeridas:
    - gestacao_intercorrencias
    - parto_tipo (Ex: Normal, Cesárea, Fórceps)
    - desenvolvimento_motor
    - desenvolvimento_linguagem
    - historico_medico
    - medicamentos_atuais
    - alergias
    - diagnostico_principal

    Se houver texto corrido, resuma os pontos principais para cada campo.`

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

        // Limpeza básica para garantir JSON válido
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        return JSON.parse(cleanText)
    } catch (e: any) {
        console.error('Erro na extração IA:', e)
        throw new Error('Falha ao processar imagem com IA: ' + e.message)
    }
}

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
    valor_sessao_padrao: number | null
    dia_vencimento_padrao: number | null
    convenio_nome: string | null
    convenio_numero_carteirinha: string | null
    convenio_validade: string | null
    operadora_id: number | null
    operadora?: { nome_fantasia: string; registro_ans?: string }
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

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()

    let filterIds: number[] | null = null

    if (user) {
        // 2. Check user profile
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('tipo_perfil')
            .eq('id', user.id)
            .single()

        if (usuario?.tipo_perfil === 'terapeuta') {
            // 3. Get linked patients for therapist
            const { data: links } = await supabase
                .from('pacientes_terapeutas')
                .select('paciente_id')
                .eq('terapeuta_id', user.id)

            if (links) {
                filterIds = links.map(link => link.paciente_id)
            } else {
                filterIds = [] // No patients linked
            }
        }
    }

    let query = supabase
        .from('pacientes')
        .select(`
            *,
            operadora:saas_operadoras(nome_fantasia, registro_ans),
            pacientes_responsaveis!left (
                responsavel:responsaveis (*)
            )
        `)
        .eq('ativo', true)
        .order('nome', { ascending: true })

    if (clinicaId) {
        query = query.eq('id_clinica', clinicaId)
    }

    // 4. Apply filter if it's a therapist
    if (filterIds !== null) {
        query = query.in('id', filterIds)
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
        .select(`
            *,
            operadora:saas_operadoras(nome_fantasia, registro_ans)
        `)
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

    // 1. Get current user to check profile
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Extract file if present
    const file = formData.get('foto') as File

    // 3. Prepare initial data
    const pacienteData = {
        id_clinica: Number(formData.get('clinica_id')),
        nome: formData.get('nome') as string,
        data_nascimento: formData.get('data_nascimento') as string,
        foto_url: null,
        observacoes: formData.get('observacoes') as string || null,
        valor_sessao_padrao: formData.get('valor_sessao_padrao') ? Number(formData.get('valor_sessao_padrao')) : null,
        dia_vencimento_padrao: formData.get('dia_vencimento_padrao') ? Number(formData.get('dia_vencimento_padrao')) : null,
        convenio_nome: formData.get('convenio_nome') as string || null,
        convenio_numero_carteirinha: formData.get('convenio_numero_carteirinha') as string || null,
        convenio_validade: formData.get('convenio_validade') as string || null,
        operadora_id: formData.get('operadora_id') ? Number(formData.get('operadora_id')) : null,
    }

    // 4. Insert Patient
    const { data, error } = await supabase
        .from('pacientes')
        .insert(pacienteData)
        .select()
        .single()

    if (error) {
        console.error('Erro ao criar paciente:', error)
        throw new Error('Erro ao criar paciente')
    }

    const newPaciente = data as Paciente

    // 5. If creator is a therapist, link them automatically
    if (user) {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('tipo_perfil')
            .eq('id', user.id)
            .single()

        if (usuario?.tipo_perfil === 'terapeuta') {
            await supabase
                .from('pacientes_terapeutas')
                .insert({
                    paciente_id: newPaciente.id,
                    terapeuta_id: user.id
                })
        }
    }

    // 6. Upload photo if exists
    if (file && file.size > 0 && file.name) {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `pacientes/${newPaciente.id}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('fotos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('fotos')
                    .getPublicUrl(fileName)

                await supabase
                    .from('pacientes')
                    .update({ foto_url: publicUrl })
                    .eq('id', newPaciente.id)

                newPaciente.foto_url = publicUrl
            }
        } catch (e) {
            console.error('Erro ao fazer upload da photo no cadastro:', e)
        }
    }

    revalidatePath('/admin/pacientes')
    revalidatePath(`/clinica/${pacienteData.id_clinica}/pacientes`)
    return newPaciente
}

export async function updatePaciente(id: number, formData: FormData) {
    const supabase = await createClient()

    const pacienteData = {
        nome: formData.get('nome') as string,
        data_nascimento: formData.get('data_nascimento') as string,
        foto_url: formData.get('foto_url') as string || null,
        observacoes: formData.get('observacoes') as string || null,
        valor_sessao_padrao: formData.get('valor_sessao_padrao') ? Number(formData.get('valor_sessao_padrao')) : null,
        dia_vencimento_padrao: formData.get('dia_vencimento_padrao') ? Number(formData.get('dia_vencimento_padrao')) : null,
        convenio_nome: formData.get('convenio_nome') as string || null,
        convenio_numero_carteirinha: formData.get('convenio_numero_carteirinha') as string || null,
        convenio_validade: formData.get('convenio_validade') as string || null,
        operadora_id: formData.get('operadora_id') ? Number(formData.get('operadora_id')) : null,
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
    const supabaseAdmin = await createAdminClient()

    // Primeiro, criar ou buscar o responsável usando Admin Client (Bypass RLS)
    const { data: existingResp } = await supabaseAdmin
        .from('responsaveis')
        .select('*')
        .eq('cpf', responsavelData.cpf)
        .single()

    let responsavelId: number

    if (existingResp) {
        // [MODIFICADO] Usuário solicitou bloquear duplicação de CPF
        throw new Error(`Um responsável com o CPF ${responsavelData.cpf} já está cadastrado no sistema.`)
    } else {
        const { data: newResp, error: respError } = await supabaseAdmin
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

    // Agora, criar a relação (Usando client do usuário para garantir permissão no paciente)
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

export async function searchResponsaveis(query: string) {
    const supabaseAdmin = await createAdminClient()

    if (!query || query.length < 3) return []

    // Busca por Nome ou CPF
    // Nota: ilike é case-insensitive
    const { data, error } = await supabaseAdmin
        .from('responsaveis')
        .select('id, nome, cpf, whatsapp')
        .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`)
        .limit(10)

    if (error) {
        console.error('Erro ao buscar responsáveis:', error)
        return []
    }

    return data
}

export async function linkResponsavel(pacienteId: number, responsavelId: number, dadosVinculo: {
    grau_parentesco: string
    responsavel_principal: boolean
}) {
    const supabase = await createClient()

    // Verificar se já existe vínculo
    const { data: existing } = await supabase
        .from('pacientes_responsaveis')
        .select('id')
        .eq('paciente_id', pacienteId)
        .eq('responsavel_id', responsavelId)
        .single()

    if (existing) {
        throw new Error('Este responsável já está vinculado a este paciente.')
    }

    const { error } = await supabase
        .from('pacientes_responsaveis')
        .insert({
            paciente_id: pacienteId,
            responsavel_id: responsavelId,
            grau_parentesco: dadosVinculo.grau_parentesco,
            responsavel_principal: dadosVinculo.responsavel_principal,
        })

    if (error) {
        console.error('Erro ao vincular responsável:', error)
        throw new Error('Erro ao vincular responsável')
    }

    revalidatePath(`/admin/pacientes/${pacienteId}`)
}



export async function getResponsaveisDoTerapeuta() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Buscar Pacientes do Terapeuta
    const { data: pacientes } = await supabase
        .from('pacientes_terapeutas')
        .select('paciente_id')
        .eq('terapeuta_id', user.id)

    if (!pacientes || pacientes.length === 0) return []

    const pacienteIds = pacientes.map(p => p.paciente_id)

    // 2. Buscar Responsáveis desses Pacientes
    const { data: vinculos } = await supabase
        .from('pacientes_responsaveis')
        .select('responsavel_id')
        .in('paciente_id', pacienteIds)

    if (!vinculos || vinculos.length === 0) return []

    const responsavelIds = vinculos.map(v => v.responsavel_id)

    // 3. Buscar Dados dos Responsáveis (Distinct via Set ou SQL se preferir)
    // O supabase 'in' já filtra, mas precisamos garantir unicidade se houver repetição de IDs no array?
    // O 'in' aceita repetição, mas o resultado será unico por ID se selecionarmos da tabela responsaveis.

    // Eliminando duplicatas do array de IDs apenas para limpar a query
    const uniqueIds = Array.from(new Set(responsavelIds))

    const { data: responsaveis } = await supabase
        .from('responsaveis')
        .select('*')
        .in('id', uniqueIds)
        .order('created_at', { ascending: false })

    return responsaveis || []
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

export async function getPacientesDoTerapeuta(terapeutaId: string) {
    const supabase = await createClient()

    // Fetch patients linked to the therapist via pacientes_terapeutas table
    const { data, error } = await supabase
        .from('pacientes_terapeutas')
        .select(`
            paciente:pacientes (
                *,
                pacientes_responsaveis!left (
                    responsavel:responsaveis (*)
                )
            )
        `)
        .eq('terapeuta_id', terapeutaId)
        .eq('ativo', true)

    if (error) {
        console.error('Erro ao buscar pacientes do terapeuta:', error)
        return []
    }

    // Flatten the result to return just the patient objects
    // Filter out nulls just in case
    return data
        .map(item => item.paciente)
        .filter(p => p !== null) as any[]
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
