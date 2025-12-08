-- Script para Criar Dados de Teste (Paciente + Contrato)
-- Execute no SQL Editor do Supabase se precisar de dados para testar o fluxo financeiro.

DO $$
    DECLARE
        new_paciente_id BIGINT;
        new_responsavel_id BIGINT;
        user_id UUID;
        clinica_id BIGINT;
    BEGIN
        SELECT id, id_clinica INTO user_id, clinica_id FROM usuarios LIMIT 1;

        -- 1. Paciente
        INSERT INTO pacientes (id_clinica, nome, data_nascimento, status)
        VALUES (clinica_id, 'Paciente Teste Flow', '1990-01-01', 'ativo')
        RETURNING id INTO new_paciente_id;

        -- 2. Responsável
        INSERT INTO responsaveis (id_clinica, nome, cpf)
        VALUES (clinica_id, 'Responsável Teste', '00000000000')
        RETURNING id INTO new_responsavel_id;

        -- Vincular
        INSERT INTO pacientes_responsaveis (id_paciente, id_responsavel)
        VALUES (new_paciente_id, new_responsavel_id);

        -- 3. Contrato
        INSERT INTO contratos (
            id_clinica, id_paciente, id_responsavel, id_terapeuta,
            tipo_cobranca, valor, dia_vencimento, ativo, status
        )
        VALUES (
            clinica_id, new_paciente_id, new_responsavel_id, user_id,
            'por_sessao', 100.00, 10, true, 'ativo'
        );
    END $$;
