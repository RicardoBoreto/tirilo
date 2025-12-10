
-- 1. Listar todos os usuários (para identificar o email do responsável)
SELECT id, email, nome_completo, tipo_usuario FROM usuarios;

-- 2. Listar tabela de responsáveis
SELECT * FROM responsaveis;

-- 3. Listar tabela de vínculos (paciente <-> responsável)
SELECT 
    pr.id, 
    p.nome as nome_paciente, 
    r.nome as nome_responsavel 
FROM pacientes_responsaveis pr
JOIN pacientes p ON p.id = pr.paciente_id
JOIN responsaveis r ON r.id = pr.responsavel_id;

-- 4. Para corrigir, você precisará de 3 passos:
--    A. Garantir que o usuário esteja na tabela 'usuarios'.
--    B. Garantir que o usuário esteja na tabela 'responsaveis'.
--    C. Criar o vínculo em 'pacientes_responsaveis'.

-- EXEMPLO DE CORREÇÃO (SUBSTITUA OS VALORES):
/*
-- 1. Inserir Responsável (se não existir)
INSERT INTO responsaveis (user_id, nome, cpf, telefone)
SELECT id, nome_completo, '00000000000', '000000000'
FROM usuarios 
WHERE email = 'EMAIL_DO_RESPONSAVEL@EXEMPLO.COM'
ON CONFLICT (user_id) DO NOTHING;

-- 2. Vincular ao Paciente
INSERT INTO pacientes_responsaveis (paciente_id, responsavel_id)
SELECT 
    (SELECT id FROM pacientes WHERE nome ILIKE '%NOME_DO_PACIENTE%' LIMIT 1),
    (SELECT id FROM responsaveis WHERE user_id = (SELECT id FROM usuarios WHERE email = 'EMAIL_DO_RESPONSAVEL@EXEMPLO.COM'))
ON CONFLICT DO NOTHING;
*/
