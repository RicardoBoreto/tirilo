const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================================
// COLE SUA CHAVE AQUI DENTRO DAS ASPAS
const API_KEY = "AIzaSyDsqrh-TQUhtjygGNCJv5OI9S7p-jaIv3U";
// ==========================================

async function testKey() {
    if (API_KEY === "AIzaSyDsqrh-TQUhtjygGNCJv5OI9S7p-jaIv3U") {
        console.error("❌ ERRO: Você precisa editar este arquivo e colocar sua chave API na variável API_KEY.");
        return;
    }

    console.log(`🔑 Testando chave: ${API_KEY.substring(0, 5)}...`);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("📡 Enviando requisição para o Google Gemini...");
        const result = await model.generateContent("Diga 'Olá, a chave funcionou!' em português.");
        const response = await result.response;
        const text = response.text();

        console.log("\n✅ SUCESSO! A API respondeu:");
        console.log("------------------------------------------------");
        console.log(text);
        console.log("------------------------------------------------");
    } catch (error) {
        console.error("\n❌ FALHA: A API retornou um erro.");
        console.error("Mensagem de erro:", error.message);

        if (error.message.includes("403")) {
            console.error("\n💡 DICA: Erro 403 geralmente significa que a chave é inválida ou não tem permissão.");
        }
    }
}

testKey();
