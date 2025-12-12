export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            saas_clinicas: {
                Row: {
                    id: number
                    created_at: string
                    razao_social: string
                    nome_fantasia: string | null
                    cnpj: string | null
                    logo_url: string | null
                    status_assinatura: string
                    config_cor_primaria: string
                    plano_atual: string
                    max_terapeutas: number
                    inscricao_estadual: string | null
                    missao: string | null
                    end_cep: string | null
                    end_logradouro: string | null
                    end_numero: string | null
                    end_complemento: string | null
                    end_bairro: string | null
                    end_cidade: string | null
                    end_estado: string | null
                }
                Insert: {
                    id?: never
                    created_at?: string
                    razao_social: string
                    nome_fantasia?: string | null
                    cnpj?: string | null
                    logo_url?: string | null
                    status_assinatura?: string
                    config_cor_primaria?: string
                    plano_atual?: string
                    max_terapeutas?: number
                    inscricao_estadual?: string | null
                    missao?: string | null
                    end_cep?: string | null
                    end_logradouro?: string | null
                    end_numero?: string | null
                    end_complemento?: string | null
                    end_bairro?: string | null
                    end_cidade?: string | null
                    end_estado?: string | null
                }
                Update: {
                    id?: never
                    created_at?: string
                    razao_social?: string
                    nome_fantasia?: string | null
                    cnpj?: string | null
                    logo_url?: string | null
                    status_assinatura?: string
                    config_cor_primaria?: string
                    plano_atual?: string
                    max_terapeutas?: number
                    inscricao_estadual?: string | null
                    missao?: string | null
                    end_cep?: string | null
                    end_logradouro?: string | null
                    end_numero?: string | null
                    end_complemento?: string | null
                    end_bairro?: string | null
                    end_cidade?: string | null
                    end_estado?: string | null
                }
            }
            usuarios: {
                Row: {
                    id: string
                    created_at: string
                    email: string
                    nome_completo: string
                    cpf: string | null
                    celular_whatsapp: string | null
                    tipo_perfil: 'master_admin' | 'admin_clinica' | 'terapeuta' | 'responsavel'
                    id_clinica: number | null
                    foto_url: string | null
                }
                Insert: {
                    id: string
                    created_at?: string
                    email: string
                    nome_completo: string
                    cpf?: string | null
                    celular_whatsapp?: string | null
                    tipo_perfil: 'master_admin' | 'admin_clinica' | 'terapeuta' | 'responsavel'
                    id_clinica?: number | null
                    foto_url?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    email?: string
                    nome_completo?: string
                    cpf?: string | null
                    celular_whatsapp?: string | null
                    tipo_perfil?: 'master_admin' | 'admin_clinica' | 'terapeuta' | 'responsavel'
                    id_clinica?: number | null
                    foto_url?: string | null
                }
            }
            terapeutas_curriculo: {
                Row: {
                    id: number
                    created_at: string
                    id_usuario: string
                    id_clinica: number
                    registro_profissional: string | null
                    formacao: string | null
                    especialidades: string[] | null
                    publico_alvo: string[] | null
                    bio: string | null
                }
                Insert: {
                    id?: never
                    created_at?: string
                    id_usuario: string
                    id_clinica: number
                    registro_profissional?: string | null
                    formacao?: string | null
                    especialidades?: string[] | null
                    publico_alvo?: string[] | null
                    bio?: string | null
                }
                Update: {
                    id?: never
                    created_at?: string
                    id_usuario?: string
                    id_clinica?: number
                    registro_profissional?: string | null
                    formacao?: string | null
                    especialidades?: string[] | null
                    publico_alvo?: string[] | null
                    bio?: string | null
                }
            }
            pacientes: {
                Row: {
                    id: number
                    created_at: string
                    clinica_id: number
                    nome: string
                    data_nascimento: string
                    foto_url: string | null
                    observacoes: string | null
                    ativo: boolean
                }
                Insert: {
                    id?: never
                    created_at?: string
                    clinica_id: number
                    nome: string
                    data_nascimento: string
                    foto_url?: string | null
                    observacoes?: string | null
                    ativo?: boolean
                }
                Update: {
                    id?: never
                    created_at?: string
                    clinica_id?: number
                    nome?: string
                    data_nascimento?: string
                    foto_url?: string | null
                    observacoes?: string | null
                    ativo?: boolean
                }
            }
            responsaveis: {
                Row: {
                    id: number
                    created_at: string
                    nome: string
                    cpf: string
                    whatsapp: string
                    email: string | null
                    user_id: string | null
                }
                Insert: {
                    id?: never
                    created_at?: string
                    nome: string
                    cpf: string
                    whatsapp: string
                    email?: string | null
                    user_id?: string | null
                }
                Update: {
                    id?: never
                    created_at?: string
                    nome?: string
                    cpf?: string
                    whatsapp?: string
                    email?: string | null
                    user_id?: string | null
                }
            }
            pacientes_responsaveis: {
                Row: {
                    id: number
                    created_at: string
                    paciente_id: number
                    responsavel_id: number
                    grau_parentesco: string
                    responsavel_principal: boolean
                }
                Insert: {
                    id?: never
                    created_at?: string
                    paciente_id: number
                    responsavel_id: number
                    grau_parentesco: string
                    responsavel_principal?: boolean
                }
                Update: {
                    id?: never
                    created_at?: string
                    paciente_id?: number
                    responsavel_id?: number
                    grau_parentesco?: string
                    responsavel_principal?: boolean
                }
            }
            pacientes_anamnese: {
                Row: {
                    id: number
                    created_at: string
                    updated_at: string
                    paciente_id: number
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
                    musicoterapia: Json | null
                }
                Insert: {
                    id?: never
                    created_at?: string
                    updated_at?: string
                    paciente_id: number
                    gestacao_intercorrencias?: string | null
                    parto_tipo?: string | null
                    desenvolvimento_motor?: string | null
                    desenvolvimento_linguagem?: string | null
                    historico_medico?: string | null
                    medicamentos_atuais?: string | null
                    alergias?: string | null
                    laudo_medico_arquivo_url?: string | null
                    laudo_medico_data_upload?: string | null
                    diagnostico_principal?: string | null
                    musicoterapia?: Json | null
                }
                Update: {
                    id?: never
                    created_at?: string
                    updated_at?: string
                    paciente_id?: number
                    gestacao_intercorrencias?: string | null
                    parto_tipo?: string | null
                    desenvolvimento_motor?: string | null
                    desenvolvimento_linguagem?: string | null
                    historico_medico?: string | null
                    medicamentos_atuais?: string | null
                    alergias?: string | null
                    laudo_medico_arquivo_url?: string | null
                    laudo_medico_data_upload?: string | null
                    diagnostico_principal?: string | null
                    musicoterapia?: Json | null
                }
            }
            pacientes_terapeutas: {
                Row: {
                    paciente_id: number
                    terapeuta_id: string
                    created_at: string
                }
                Insert: {
                    paciente_id: number
                    terapeuta_id: string
                    created_at?: string
                }
                Update: {
                    paciente_id?: number
                    terapeuta_id?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
