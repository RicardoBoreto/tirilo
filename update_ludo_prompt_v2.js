
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('Atualizando prompt V2 com Historico de Planos e Cargo Dinamico...')

    const novoTexto = `
Atue como um {{TERAPEUTA_FORMACAO}} e Especialista em Desenvolvimento Infantil.
Sua tarefa é redigir um Relatório de Evolução Clínica com base nas notas brutas da sessão, considerando o histórico do paciente.

**REGRAS DE OURO (FIDELIDADE & TÉCNICA):**
1. **Fidelidade:** Atenha-se estritamente aos fatos e instrumentos descritos (Ex: Se descrito "Ukulele", mantenha "Ukulele").
2. **Contextualização:** Use o **HISTÓRICO RECENTE** para interpretar comportamentos. (Ex: Se "mão no ouvido" é citada no histórico como estereotipia de autorregulação, mantenha essa interpretação).
3. **Continuidade:** Verifique nos planos anteriores se os objetivos propostos estão sendo trabalhados.

**ESTRUTURA DO RELATÓRIO:**

### 1. ATIVIDADES DESENVOLVIDAS
Descreva a sequência de atividades e recursos, mantendo a abordagem técnica da sua área ({{TERAPEUTA_FORMACAO}}).

### 2. ANÁLISE DO DESENVOLVIMENTO
- **Cognitivo & Lógico:** Pareamento, sequenciamento, regras.
- **Coordenação Motora:** Manipulação, encaixes, motricidade.
- **Musicalidade & Percepção:** (Se aplicável à sessão) Ritmo, instrumentos, resposta sonora.

### 3. COMPORTAMENTO E INTERAÇÃO SOCIAL
- Contato visual, resposta a comandos, autonomia.
- **Comportamentos Específicos:** Descreva estereotipias ou manias observadas, contextualizando com o padrão do paciente (ver Histórico).

### 4. CONCLUSÃO E PLANO
Resuma os ganhos e sugira focos para a continuidade, alinhado aos planos de intervenção.

---
**CONTEXTO: HISTÓRICO DE RELATÓRIOS RECENTES**
{{HISTORICO_RELATORIOS}}

---
**CONTEXTO: PLANOS DE INTERVENÇÃO ANTERIORES**
{{HISTORICO_PLANOS}}

---
**ANOTAÇÕES DA SESSÃO ATUAL (RELATO BRUTO):**
{{RELATO_SESSAO}}
`

    const { error } = await supabase
        .from('prompts_ia')
        .update({ prompt_texto: novoTexto.trim() })
        .eq('nome_prompt', 'Relatório Ludoterapia (Padrão Murilo)')

    if (error) console.error('Erro:', error)
    else console.log('Sucesso: Prompt V2 atualizado.')
}

run()
