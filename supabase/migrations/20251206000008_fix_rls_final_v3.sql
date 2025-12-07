-- Solução Definitiva para o Problema de Recursão e Visibilidade
-- Abordagem:
-- 1. 'usuarios': Leitura liberada para usuários logados (quebra o loop infinito)
-- 2. 'pacientes': Isolamento estrito por clínica (garante a regra de negócio principal)
-- 3. 'pacientes_terapeutas': Isolamento estrito por clínica (herda de pacientes)

-- ============================================================================
-- 1. TABELA USUARIOS
-- ============================================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas que causavam recursão
DROP POLICY IF EXISTS "Users can view users from their clinic" ON usuarios;
DROP POLICY IF EXISTS "Users can view all users" ON usuarios;
DROP POLICY IF EXISTS "Public read for authenticated users" ON usuarios;

-- Nova política: Usuários autenticados podem ver lista de usuários (necessário para o sistema funcionar)
-- Isso elimina a checagem recursiva "quem sou eu?" que travava o banco.
CREATE POLICY "Authenticated users can view all users" ON usuarios
FOR SELECT TO authenticated USING (true);

-- Manter restrição de edição (apenas o próprio usuário ou admin da clínica)
DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios;
CREATE POLICY "Users can update their own profile" ON usuarios
FOR UPDATE USING (id = auth.uid());


-- ============================================================================
-- 2. TABELA PACIENTES
-- ============================================================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pacientes from their clinic" ON pacientes;

-- AQUI está a segurança crítica: O paciente só é visível se pertencer à mesma clínica do usuário.
-- Como 'usuarios' agora é legível, esta subquery não causa mais loop debug.
CREATE POLICY "Clinic isolation for patients" ON pacientes
FOR SELECT USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- Políticas de escrita (CRUD)
DROP POLICY IF EXISTS "Users can insert pacientes for their clinic" ON pacientes;
CREATE POLICY "Users can insert pacientes for their clinic" ON pacientes
FOR INSERT WITH CHECK (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can update pacientes from their clinic" ON pacientes
FOR UPDATE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete pacientes from their clinic" ON pacientes;
CREATE POLICY "Users can delete pacientes from their clinic" ON pacientes
FOR DELETE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);


-- ============================================================================
-- 3. TABELA PACIENTES_TERAPEUTAS
-- ============================================================================
ALTER TABLE pacientes_terapeutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their clinic's patient-therapist relationships" ON pacientes_terapeutas;

-- Segurança: Só vê o vínculo se tiver acesso ao paciente (ou seja, mesma clínica)
CREATE POLICY "Clinic isolation for relationships" ON pacientes_terapeutas
FOR SELECT USING (
    paciente_id IN (SELECT id FROM pacientes)
);
