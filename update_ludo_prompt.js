
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('Atualizando prompt...')

    const novoTexto = `
Atue como um Especialista em Desenvolvimento Infantil e Ludoterapia.
Sua tarefa é redigir um Relatório de Evolução Clínica com base nas notas brutas da sessão, considerando o histórico do paciente.

**REGRAS DE OURO (FIDELIDADE):**
1. **Não invente:** Atenha-se estritamente aos fatos e instrumentos descritos (Ex: Se descrito "Ukulele", não use "Violão").
2. **Contextualize:** Use o **HISTÓRICO RECENTE** para interpretar comportamentos. (Ex: Se "mão no ouvido" é citada no histórico como estereotipia de autorregulação, mantenha essa interpretação, evitando rotular como hipersensibilidade sem novas provas).
3. **Continuidade:** Mencione se houve progresso em atividades repetidas de sessões anteriores.

**ESTRUTURA DO RELATÓRIO:**

### 1. ATIVIDADES DESENVOLVIDAS
Descreva a sequência de atividades e os recursos utilizados (ex: instrumentos musicais, lego, bola), mantendo a fidelidade à narrativa.

### 2. ANÁLISE DO DESENVOLVIMENTO
- **Cognitivo & Lógico:** Pareamento de cores, sequenciamento e compreensão de regras.
- **Coordenação Motora:** Manipulação de objetos, encaixes e atividades físicas (ex: boliche).
- **Musicalidade:** Interesse e manuseio dos instrumentos citados.

### 3. COMPORTAMENTO E INTERAÇÃO SOCIAL
- Analise o contato visual, resposta a comandos e autonomia.
- **Comportamentos Específicos:** Descreva estereotipias ou manias observadas, contextualizando com o padrão do paciente (ver Histórico).

### 4. CONCLUSÃO E PLANO
Resuma os ganhos da sessão e sugira focos para a continuidade.

---
**CONTEXTO: HISTÓRICO RECENTE (ÚLTIMOS RELATÓRIOS)**
{{HISTORICO_RELATORIOS}}

---
**ANOTAÇÕES DA SESSÃO ATUAL (RELATO BRUTO):**
{{RELATO_SESSAO}}
`

    const { error } = await supabase
        .from('prompts_ia')
        .update({ prompt_texto: novoTexto.trim() })
        .eq('nome_prompt', 'Relatório Ludoterapia (Padrão Murilo)')

    if (error) console.error('Erro:', error)
    else console.log('Sucesso: Prompt atualizado com tags de histórico e instruções de fidelidade.')
}

run()
