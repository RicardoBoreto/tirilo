
-- Permitir que Responsáveis vejam sessões lúdicas de seus filhos
CREATE POLICY "Responsaveis view sessoes filhos" ON sessao_ludica
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pacientes_responsaveis pr
    JOIN responsaveis r ON r.id = pr.responsavel_id
    WHERE pr.paciente_id = sessao_ludica.paciente_id
    AND r.user_id = auth.uid()
  )
);

-- Permitir que Responsáveis vejam diário de bordo (detalhes) de seus filhos
CREATE POLICY "Responsaveis view diario filhos" ON sessao_diario_bordo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessao_ludica sl
    JOIN pacientes_responsaveis pr ON pr.paciente_id = sl.paciente_id
    JOIN responsaveis r ON r.id = pr.responsavel_id
    WHERE sl.id = sessao_diario_bordo.sessao_ludica_id
    AND r.user_id = auth.uid()
  )
);
