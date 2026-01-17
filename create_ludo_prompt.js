
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPrompt() {
    console.log('Buscando usuário para vincular o prompt...')
    const { data: users, error: uError } = await supabase.from('usuarios').select('id, id_clinica').limit(1)

    if (uError || !users || users.length === 0) {
        console.error('Erro ao buscar usuário:', uError)
        return
    }
    const user = users[0]
    console.log(`Vinculando ao usuário ID: ${user.id} da clínica ${user.id_clinica}`)

    const promptText = `
Você é um Terapeuta Especialista em Desenvolvimento Infantil e Ludoterapia.
Sua tarefa é transformar as anotações brutas de uma sessão (fornecidas abaixo) em um Relatório de Evolução Clínica profissional, técnico e bem estruturado.

Utilize a seguinte estrutura para o relatório:

### 1. DESCRIÇÃO DAS ATIVIDADES (LUDOTERAPIA)
Descreva de forma sequencial e técnica as atividades realizadas na sessão (ex: exploração musical, construção com blocos, jogos de regras, brincadeiras motoras).

### 2. ANÁLISE DO DESENVOLVIMENTO
Analise o desempenho da criança nas seguintes áreas, citando evidências observadas:
- **Cognitivo:** Capacidade de pareamento (cores/formas), seriação, compreensão de regras e lógica.
- **Coordenação Motora:** Motricidade fina (encaixes, cartas) e grossa (bola, boliche).
- **Musicalidade:** Interesse, ritmo e exploração de instrumentos.

### 3. ASPECTOS COMPORTAMENTAIS E SOCIAIS
- **Interação:** Resposta à interação do terapeuta, contato visual, imitação e atenção compartilhada.
- **Comportamentos Atípicos:** Relate observações sobre estereotipias (ex: cobrir ouvidos), desvio de olhar (olhar para cima) ou rigidez cognitiva.
- **Autonomia e Iniciativa:** Como a criança propõe ou aceita as atividades.

### 4. CONSIDERAÇÕES FINAIS
Resumo qualitativo da sessão e pontos de atenção para os próximos atendimentos.

---
**ANOTAÇÕES BRUTAS DA SESSÃO:**
{{INPUT}}
`

    console.log('Inserindo prompt...')
    const { error } = await supabase.from('prompts_ia').insert({
        id_clinica: user.id_clinica || 1,
        terapeuta_id: user.id,
        nome_prompt: 'Relatório Ludoterapia (Padrão Murilo)',
        descricao: 'Gera relatório detalhado focando em aspectos cognitivos, motores e comportamentais (ideal para autismo/ludoterapia).',
        prompt_texto: promptText.trim(),
        modelo_gemini: 'gemini-2.5-flash',
        categoria: 'relatorio',
        ativo: true
        // removendo criado_por pois parece ser UUID no banco real
    })

    if (error) {
        console.error('Erro ao criar prompt:', error)
    } else {
        console.log('SUCESSO: Prompt "Relatório Ludoterapia (Padrão Murilo)" criado na tabela prompts_ia.')
    }
}

createPrompt()
