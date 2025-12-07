-- CLEANUP TOTAL DAS POLÍTICAS DE SEGURANÇA
-- Objetivo: Garantir que não existam políticas antigas ou duplicadas causando conflito

-- 1. Desativar RLS momentaneamente para limpar a casa
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_terapeutas DISABLE ROW LEVEL SECURITY;

-- 2. Drop de TODAS as políticas conhecidas (lista acumulada de todas as tentativas)
DROP POLICY IF EXISTS "Super Admin can view all clinics" ON saas_clinicas;
DROP POLICY IF EXISTS "Users can view users from their clinic" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON usuarios;
DROP POLICY IF EXISTS "Users can view all users" ON usuarios;
DROP POLICY IF EXISTS "Public read for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios;

DROP POLICY IF EXISTS "Users can view pacientes from their clinic" ON pacientes;
DROP POLICY IF EXISTS "Clinic isolation for patients" ON pacientes;
DROP POLICY IF EXISTS "Users can insert pacientes for their clinic" ON pacientes;
DROP POLICY IF EXISTS "Users can update pacientes from their clinic" ON pacientes;
DROP POLICY IF EXISTS "Users can delete pacientes from their clinic" ON pacientes;

DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;
DROP POLICY IF EXISTS "Clinic isolation for relationships" ON pacientes_terapeutas;

-- 3. Reativar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_terapeutas ENABLE ROW LEVEL SECURITY;

-- 4. Aplicar a Regra de Ouro (Simples e Eficaz)
-- USUARIOS: Leitura livre para autenticados (evita recursão)
CREATE POLICY "Authenticated users can view all users" ON usuarios
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON usuarios
FOR UPDATE USING (id = auth.uid());

-- PACIENTES: Isolamento por CLÍNICA (Regra de Negócio Principal)
CREATE POLICY "Clinic isolation for patients" ON pacientes
FOR SELECT USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Clinic isolation for patients insert" ON pacientes
FOR INSERT WITH CHECK (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Clinic isolation for patients update" ON pacientes
FOR UPDATE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Clinic isolation for patients delete" ON pacientes
FOR DELETE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- VÍNCULOS: Isolamento derivado de pacientes
CREATE POLICY "Clinic isolation for relationships" ON pacientes_terapeutas
FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes)
);
