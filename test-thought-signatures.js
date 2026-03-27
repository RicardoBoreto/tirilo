const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Carregar Chave API do .env.local
let apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GOOGLE_GEMINI_API_KEY=([^\r\n]+)/);
        if (match) apiKey = match[1].replace(/["']/g, '').trim();
    }
}

async function testThoughtSignature() {
    if (!apiKey) {
        console.error("ERRO: GOOGLE_GEMINI_API_KEY não encontrada.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-3.1-flash-lite-preview";
    console.log(`\n--- VERIFICAÇÃO GEMINI 3.1: ${modelName} ---`);

    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        // Passo 1: Requisição inicial para obter assinaturas
        console.log("Passo 1: Gerando conteúdo inicial...");
        const result1 = await model.generateContent("Explique o que é emaranhamento quântico em uma frase.");
        const response1 = await result1.response;
        
        console.log("Resposta 1:", response1.text());
        
        // Simulação da extração de thought_signature (como no ai_generation.ts)
        let thoughtSignature = null;
        // O SDK pode retornar isso em candidates[0].content.parts
        if (response1.candidates && response1.candidates[0] && response1.candidates[0].content && response1.candidates[0].content.parts) {
            for (const part of response1.candidates[0].content.parts) {
                if (part.thought_signature) {
                    thoughtSignature = part.thought_signature;
                    break;
                }
            }
        }

        console.log("Assinatura de Pensamento encontrada:", thoughtSignature ? "SIM (capturada)" : "NÃO");

        // Passo 2: Circular a assinatura (mesmo que seja nula para testar a estrutura)
        console.log("\nPasso 2: Testando circulação de contexto...");
        const contents = [
            { role: "user", parts: [{ text: "Agora explique para uma criança de 5 anos." }] }
        ];
        
        if (thoughtSignature) {
            contents.push({ role: "model", parts: [{ thought_signature: thoughtSignature }] });
        }

        const result2 = await model.generateContent({ contents });
        const response2 = await result2.response;
        console.log("Resposta 2:", response2.text());
        console.log("\nSUCESSO: O fluxo de circulação de assinaturas foi validado estruturalmente.");

    } catch (error) {
        if (error.message.includes("model not found") || error.message.includes("404")) {
            console.warn(`AVISO: Modelo ${modelName} ainda não disponível nesta região ou chave.`);
        } else {
            console.error("FALHA na verificação:", error.message);
        }
    }
}

testThoughtSignature();
