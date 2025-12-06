-- Adicionar políticas de INSERT, UPDATE e DELETE para pacientes

CREATE POLICY "Users can insert pacientes for their clinic" ON pacientes
FOR INSERT WITH CHECK (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Users can update pacientes from their clinic" ON pacientes
FOR UPDATE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Users can delete pacientes from their clinic" ON pacientes
FOR DELETE USING (
    id_clinica IN (SELECT id_clinica FROM usuarios WHERE id = auth.uid())
);
