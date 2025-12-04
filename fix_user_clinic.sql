-- Script para verificar e corrigir usuários sem id_clinica

-- 1. Verificar usuários sem id_clinica
SELECT id, email, nome_completo, tipo_perfil, id_clinica 
FROM usuarios 
WHERE tipo_perfil IN ('admin_clinica', 'terapeuta') 
AND id_clinica IS NULL;

-- 2. Se você encontrou seu usuário acima, atualize com o ID da clínica correta
-- Substitua 'SEU_EMAIL@exemplo.com' pelo seu email
-- Substitua 1 pelo ID da sua clínica (você pode ver na lista de clínicas)

-- UPDATE usuarios 
-- SET id_clinica = 1 
-- WHERE email = 'SEU_EMAIL@exemplo.com';

-- 3. Verificar todas as clínicas disponíveis
SELECT id, razao_social, nome_fantasia 
FROM saas_clinicas 
ORDER BY id;
