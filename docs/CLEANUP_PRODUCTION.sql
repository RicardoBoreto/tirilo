-- ============================================================================
-- SCRIPT DE LIMPEZA PARA ENTRADA EM PRODUÇÃO
-- ============================================================================
-- ATENÇÃO: ESTE SCRIPT APAGA DADOS!
-- Ele preserva: Clínicas, Usuários, Robôs, Prompts, Jogos e Configurações.
-- Ele apaga: Pacientes, Agendamentos, Sessões, Financeiro, Tickets, etc.
-- ============================================================================

BEGIN;

-- 1. SESSÕES E DADOS DE ROBÔS (TRANSACIONAIS)
TRUNCATE TABLE public.sessao_diario_bordo CASCADE;
TRUNCATE TABLE public.sessao_telemetria CASCADE;
TRUNCATE TABLE public.sessao_ludica CASCADE;
TRUNCATE TABLE public.comandos_robo CASCADE;
TRUNCATE TABLE public.saas_manutencoes_frota CASCADE;

-- 2. RELATÓRIOS E PLANOS DE IA
TRUNCATE TABLE public.relatorios_atendimento CASCADE;
TRUNCATE TABLE public.planos_intervencao_ia CASCADE;

-- 3. FINANCEIRO E CONTRATOS
TRUNCATE TABLE public.financeiro_lancamentos CASCADE;
TRUNCATE TABLE public.contratos CASCADE;

-- 4. AGENDAMENTOS E TICKETS
TRUNCATE TABLE public.agendamentos CASCADE;
TRUNCATE TABLE public.help_desk_mensagens CASCADE;
TRUNCATE TABLE public.help_desk_tickets CASCADE;

-- 5. PACIENTES E RESPONSÁVEIS (BASE DA PIRÂMIDE)
-- Limpa tabelas de ligação primeiro por segurança (embora CASCADE resolva)
TRUNCATE TABLE public.pacientes_anamnese CASCADE;
TRUNCATE TABLE public.pacientes_terapeutas CASCADE;
TRUNCATE TABLE public.pacientes_responsaveis CASCADE;

-- Limpa as entidades principais
TRUNCATE TABLE public.pacientes CASCADE;
TRUNCATE TABLE public.responsaveis CASCADE;

COMMIT;

-- ============================================================================
-- TABELAS PRESERVADAS (NÃO FORAM TOCADAS):
-- ============================================================================
-- public.saas_empresa (Dados do SaaS)
-- public.saas_clinicas (Clínicas cadastradas)
-- public.saas_operadoras (Convênios/Config)
-- public.usuarios (Terapeutas, Admins, etc)
-- public.terapeutas_curriculo (Perfis estendidos)
-- public.prompts_ia (Prompts e Modelos)
-- public.saas_frota_robos (Robôs físicos)
-- public.saas_jogos (Catálogo de Jogos)
-- public.saas_habilidades (Catálogo de Habilidades)
-- public.saas_jogos_versoes (Versões)
-- public.saas_clinicas_jogos (Licenças Compradas)
-- public.clinica_config_ia (Configurações de IA da Clínica)
-- public.financeiro_categorias (Categorias Financeiras)
-- public.clinicas_salas (Salas Físicas)
-- public.salas_recursos (Salas Alternativas)
-- public.recursos (Inventário/Materiais)
