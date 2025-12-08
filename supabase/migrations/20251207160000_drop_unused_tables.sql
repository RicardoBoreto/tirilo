-- Migration: Drop Unused Tables
-- Date: 2025-12-07
-- Description: Removes tables that were planned for future use but are now obsolete/requiring restructure.

DROP TABLE IF EXISTS avaliacao_aplicada CASCADE;
DROP TABLE IF EXISTS avaliacao_protocolos CASCADE;
DROP TABLE IF EXISTS clinica_config_ia CASCADE;
DROP TABLE IF EXISTS clinica_contatos CASCADE;
DROP TABLE IF EXISTS clinica_ia_arquivos CASCADE;
DROP TABLE IF EXISTS clinica_recursos CASCADE;
DROP TABLE IF EXISTS comandos_robo CASCADE;
DROP TABLE IF EXISTS financeiro_cobrancas CASCADE;
DROP TABLE IF EXISTS pip_metas CASCADE;
DROP TABLE IF EXISTS pip_planos CASCADE;
DROP TABLE IF EXISTS saas_audit_logs CASCADE;
DROP TABLE IF EXISTS saas_frota_robos CASCADE;
DROP TABLE IF EXISTS saas_notificacoes_sistema CASCADE;
DROP TABLE IF EXISTS saas_suporte_chamados CASCADE;
DROP TABLE IF EXISTS saas_suporte_historico CASCADE;
DROP TABLE IF EXISTS saas_tabela_precos CASCADE;
DROP TABLE IF EXISTS salas_atendimento CASCADE;
DROP TABLE IF EXISTS sessao_execucao CASCADE;
DROP TABLE IF EXISTS sessao_individual CASCADE;
DROP TABLE IF EXISTS sessao_telemetria CASCADE;
