const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

console.log("--- DIAGNOSTIC START ---");

// 1. Read API Key from .env.local
let apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const buffer = fs.readFileSync(envPath);
            let envContent;

            // Check for UTF-16 LE BOM or null bytes
            if (buffer.indexOf('\0') !== -1 || (buffer[0] === 0xFF && buffer[1] === 0xFE)) {
                envContent = buffer.toString('utf16le');
            } else {
                envContent = buffer.toString('utf8');
            }

            const lines = envContent.split(/\r?\n/);
            for (const line of lines) {
                const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    if (key === 'GOOGLE_GEMINI_API_KEY') {
                        apiKey = value;
                        console.log("Found GOOGLE_GEMINI_API_KEY in .env.local");
                        break;
                    }
                }
            }
        } else {
            console.log(".env.local file not found.");
        }
    } catch (e) {
        console.error("Error reading .env.local:", e.message);
    }
}

if (!apiKey || apiKey === 'COLE_SUA_CHAVE_AQUI') {
    console.error("CRITICAL: Invalid API Key found. Please update .env.local with your real key.");
    process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
    // Test 1: gemini-2.5-flash (Stable)
    console.log("\n--- Test 1: gemini-2.5-flash (Stable) ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Explain how AI works in a few words");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }

    // Test 2: gemini-2.0-flash-exp (Experimental)
    console.log("\n--- Test 2: gemini-2.0-flash-exp (Experimental) ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Explain how AI works in a few words");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }

    // Test 3: gemini-2.5-flash (User Requested - likely invalid)
    console.log("\n--- Test 3: gemini-2.5-flash (User Requested) ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Explain how AI works in a few words");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }
}

runTest();
