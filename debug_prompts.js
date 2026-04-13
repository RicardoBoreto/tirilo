const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Setup API Key - Adjusted path to .env.local
let apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GOOGLE_GEMINI_API_KEY=([^\r\n]+)/);
        if (match) apiKey = match[1].replace(/["']/g, '').trim();
    }
}

async function debug() {
    if (!apiKey) {
        console.error("ERRO: GOOGLE_GEMINI_API_KEY não encontrada no .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-3.1-flash-lite-preview";
    const model = genAI.getGenerativeModel({ model: modelName });

    const promptA_failed = `
# PERSONA
Você é um Professor de Música e Teclado com 15 anos de experiência em pedagogia musical para iniciantes. Seu estilo é encorajador, estruturado e técnico, adaptando-se a alunos neurotípicos com foco em clareza conceitual e prazer pela prática.

# PACIENTE (ALUNO)
Nome: HORACE
Idade: 10 anos
Perfil: Aluno(a) Neurotípico(a)
Nível: Iniciante / Conceitos Básicos

# RECURSOS E MATERIAIS DISPONÍVEIS
Além dos materiais listados abaixo, utilize apenas o que estiver nesta lista da clínica: - Teclado Casio, - Metrônomo Digital, - Partituras Disney.
- Teclado Controlador MIDI (M-Vave)
- Aplicativo de Aprendizado de Piano/Teclado (Synthesia)
- Lousa Mágica Digital (Tablet de Escrita LCD) para teoria

# TAREFA
Crie um Plano de Aula Presencial de 50 minutos focado em conceitos iniciais de música e técnica de teclado. O plano deve ser dividido em momentos didáticos claros.
`;

    const promptB_worked = `
Atue como um(a) especialista em Musicoterapia, utilizando técnicas baseadas em ABA.
O seu estilo de condução é acolhedor e focado em reforço positivo.
DADOS DO PACIENTE:
- Nome: HORACE
- Idade: 10
- Diagnóstico: TEA
- Preferências/Interesses: Galinha Pintadinha
- Sensibilidades/Restrições: Barulhos agudos
CONTEXTO ATUAL:
- Objetivo Principal: Focar na atenção compartilhada.
- Histórico Recente (Últimas Sessões): Melhorou o contato visual.
- Observações do Terapeuta: Estava agitado na última vez.
TAREFA:
Crie um PLANO DE ATENDIMENTO detalhado para a próxima sessão (50 minutos).
O plano deve ser lúdico, engajador e tecnicamente fundamentado.
`;

    console.log(`Testando Modelo: ${modelName}\n`);

    console.log("--- TESTANDO PROMPT A (O que falhou) ---");
    try {
        const start = Date.now();
        const result = await model.generateContent(promptA_failed);
        const response = await result.response;
        console.log(`Sucesso em ${Date.now() - start}ms`);
        // console.log("Resposta:", response.text());
    } catch (e) {
        console.error("ERRO NO PROMPT A:", e.message);
    }

    console.log("\n--- TESTANDO PROMPT B (O que funcionou) ---");
    try {
        const start = Date.now();
        const result = await model.generateContent(promptB_worked);
        const response = await result.response;
        console.log(`Sucesso em ${Date.now() - start}ms`);
        // console.log("Resposta:", response.text());
    } catch (e) {
        console.error("ERRO NO PROMPT B:", e.message);
    }
}

debug();
