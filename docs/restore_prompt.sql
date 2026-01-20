-- Script para restaurar/criar o Prompt de Plano de Atendimento (IA)
-- Autor: Antigravity Agent
-- Alvo: Usuário ricardo@acolherjp.com.br (ou executável por qualquer um se ajustar o WHERE)

INSERT INTO public.prompts_ia (
    id_clinica,
    terapeuta_id,
    nome_prompt,
    descricao,
    categoria,
    modelo_gemini,
    temperatura,
    ativo,
    prompt_texto
)
SELECT 
    id_clinica,
    id,
    'Plano de Atendimento (IA)',
    'Gera um plano de intervenção estruturado considerando o diagnóstico, preferências e objetivos do paciente.',
    'plano',
    'gemini-2.5-flash',
    0.7,
    true,
    'Atue como um(a) especialista em {{TERAPEUTA_FORMACAO}}, utilizando técnicas baseadas em {{TERAPEUTA_TECNICAS_PREFERIDAS}}.
O seu estilo de condução é {{TERAPEUTA_ESTILO_CONDUCAO}}.

DADOS DO PACIENTE:
• Nome: {{NOME}}
• Idade: {{IDADE}}
• Diagnóstico: {{DIAGNOSTICO}}
• Preferências/Interesses: {{PREFERENCIAS}}
• Sensibilidades/Restrições: {{SENSIBILIDADES}}

CONTEXTO ATUAL:
• Objetivo Principal: {{OBJETIVO_PRINCIPAL_PLANO}}
• Histórico Recente (Últimas Sessões): {{ULTIMAS_SESSOES}}
• Observações do Terapeuta: {{TERAPEUTA_OBSERVACOES}}

TAREFA:
Crie um PLANO DE ATENDIMENTO detalhado para a próxima sessão (50 minutos).
O plano deve ser lúdico, engajador e tecnicamente fundamentado.

ESTRUTURA DA RESPOSTA (Use Markdown):

### 1. Foco da Sessão
(Qual o objetivo específico hoje?)

### 2. Atividade Proposta
(Descrição detalhada da atividade principal. Use os interesses do paciente para engajar.)

### 3. Estratégia e Metodologia
(Passo a passo da aplicação. Como iniciar, desenvolver e finalizar.)

### 4. Recursos Necessários
(Material de apoio. Considere: {{TERAPEUTA_RECURSOS_PREFERIDOS}})

### 5. Adaptações e Flexibilidade
(Como tornar mais fácil se ele frustrar? Como tornar mais difícil se estiver fácil? Como lidar com as sensibilidades {{SENSIBILIDADES}}?)

### 6. Indicadores de Sucesso
(O que observar para saber se o objetivo foi atingido?)'

FROM public.usuarios
WHERE email = 'ricardo@acolherjp.com.br';
