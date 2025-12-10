
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Carrega variáveis de ambiente do .env.local
const fs = require('fs');
const path = require('path');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function runTest() {
    console.log("🚀 Iniciando Teste de Fluxo Completo: Ludoterapia + IA");

    try {
        // 1. Identificar Usuário Admin/Terapeuta e Clínica
        const { data: users } = await supabase.from('usuarios').select('id, id_clinica').limit(1);
        if (!users || users.length === 0) throw new Error("Sem usuários no banco");
        const userId = users[0].id;
        const clinicaId = users[0].id_clinica || 1;

        console.log(`👤 Usuário: ${userId} | Clínica: ${clinicaId}`);

        // 2. Identificar Paciente
        const { data: pacts } = await supabase.from('pacientes').select('id, nome').limit(1);
        if (!pacts || pacts.length === 0) throw new Error("Sem pacientes no banco");
        const pacienteId = pacts[0].id;
        const pacienteNome = pacts[0].nome;
        console.log(`👶 Paciente: ${pacienteNome} (ID: ${pacienteId})`);

        // 3. Criar Dados Mockados
        console.log("🛠️ Criando dados de teste...");

        // Habilidade
        console.log("   - Upserting Habilidade...");
        let { data: hab, error: errH } = await supabase.from('saas_habilidades').select('id').eq('nome', 'Teste Atenção IA').single();

        if (!hab) {
            const { data: newH, error: errNewH } = await supabase.from('saas_habilidades').insert({
                nome: 'Teste Atenção IA',
                codigo_ia: 'teste_atencao'
            }).select().single();
            if (errNewH) throw errNewH;
            hab = newH;
        }
        console.log("   -> Habilidade ID:", hab.id);

        // Jogo
        console.log("   - Upserting Jogo...");
        let { data: jogo, error: errJ } = await supabase.from('saas_jogos').select('id, nome').eq('nome', 'Jogo Teste IA').single();

        if (!jogo) {
            const { data: newJ, error: errNewJ } = await supabase.from('saas_jogos').insert({
                nome: 'Jogo Teste IA',
                ativo: true,
                comando_entrada: 'test.py'
            }).select().single();
            if (errNewJ) throw errNewJ;
            jogo = newJ;
        }
        console.log("   -> Jogo ID:", jogo.id);

        // Vínculo
        await supabase.from('saas_jogos_habilidades').upsert({
            jogo_id: jogo.id,
            habilidade_id: hab.id,
            nivel_impacto: 9
        }, { onConflict: 'jogo_id, habilidade_id' });

        // Licença
        await supabase.from('saas_clinicas_jogos').upsert({
            clinica_id: clinicaId,
            jogo_id: jogo.id,
            ativo: true
        }, { onConflict: 'clinica_id, jogo_id' });

        // Sessão Lúdica
        const { data: sessao, error: errSess } = await supabase.from('sessao_ludica').insert({
            clinica_id: clinicaId,
            paciente_id: pacienteId,
            jogo_id: jogo.id,
            pontuacao_final: 950,
            nivel_dificuldade: 'DIFICIL',
            metricas: { erros: 1, tempo_medio: '2s' },
            status: 'CONCLUIDO'
        }).select().single();

        if (errSess) throw errSess;
        console.log("   -> Sessão Criada:", sessao.id);

        // Diário de Bordo
        await supabase.from('sessao_diario_bordo').insert([
            { sessao_ludica_id: sessao.id, tipo_evento: 'FALA_TERAPEUTA', texto_transcrito: 'Muito bem, tente pegar o vermelho agora.' },
            { sessao_ludica_id: sessao.id, tipo_evento: 'FALA_ROBO', texto_transcrito: 'Parabéns! Você acertou.' },
            { sessao_ludica_id: sessao.id, tipo_evento: 'FALA_PACIENTE', texto_transcrito: 'Esse é difícil.' }
        ]);

        console.log("✅ Dados mockados criados com sucesso.");

        // 4. Testar Geração de IA
        console.log("🤖 Gerando resposta do Gemini...");

        const jogosDisp = `- ${jogo.nome} (Foco: Teste Atenção IA)`;
        const historico = `- Hoje: ${jogo.nome} (DIFICIL). Pontos: 950. [Erros: 1]`;
        const diario = `[Terapeuta]: Muito bem...\n[Robô]: Parabéns!\n[Paciente]: Esse é difícil.`;

        const prompt = `
        Você é um Terapeuta Sênior. Analise os dados abaixo e crie uma frase de conclusão.
        
        PACIENTE: ${pacienteNome}
        
        JOGOS DISPONÍVEIS NA CLÍNICA:
        ${jogosDisp}
        
        HISTÓRICO RECENTE:
        ${historico}
        
        DIÁRIO DA SESSÃO (TRANSCRIÇÃO):
        ${diario}
        
        Sua conclusão:
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        console.log("\n--- RESPOSTA DA IA ---");
        console.log(response.text());
        console.log("----------------------");

    } catch (e) {
        console.error("❌ ERRO:", e);
    }
}

runTest();
