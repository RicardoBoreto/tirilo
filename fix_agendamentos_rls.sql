-- Verificando e criando policies faltantes para Agendamentos
-- Se o usuário não puder fazer UPDATE, o faturamento falha em vincular

-- Garantir que policies de escrita existam
-- INSERT
CREATE POLICY "Users can insert agendamentos for their clinic" ON agendamentos
FOR INSERT WITH CHECK (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- UPDATE
CREATE POLICY "Users can update agendamentos from their clinic" ON agendamentos
FOR UPDATE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

-- DELETE
CREATE POLICY "Users can delete agendamentos from their clinic" ON agendamentos
FOR DELETE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);
