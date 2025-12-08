const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

console.log("--- DIAGNOSTIC START ---");

let apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const buffer = fs.readFileSync(envPath);
            let envContent;

            // Check for UTF-16 LE BOM (FF FE) or null bytes
            if (buffer.indexOf('\0') !== -1 || (buffer[0] === 0xFF && buffer[1] === 0xFE)) {
                console.log("Detected potential UTF-16 encoding.");
                envContent = buffer.toString('utf16le');
            } else {
                envContent = buffer.toString('utf8');
            }

            // Parse manually
            const lines = envContent.split(/\r?\n/);
            for (const line of lines) {
                const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();
                    // Remove surrounding quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    if (key) {
                        console.log(`Found key in .env.local: ${key}`);
                    }
                    if (key === 'GOOGLE_GEMINI_API_KEY') {
                        apiKey = value;
                        console.log("Found GOOGLE_GEMINI_API_KEY in .env.local");
                        break;
                    }
                } else {
                    if (line.trim() !== '') {
                        console.log(`Skipped line (no match): "${line}"`);
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

if (!apiKey) {
    console.error("CRITICAL: GOOGLE_GEMINI_API_KEY not found in .env.local or environment.");
} else {
    console.log(`API Key found: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`API Key length: ${apiKey.length}`);

    if (!apiKey.startsWith('AIza')) {
        console.error("WARNING: API Key does NOT start with 'AIza'. It might be invalid.");
    }
    if (apiKey.trim() !== apiKey) {
        console.error("WARNING: API Key has leading/trailing whitespace. Trimming it for test...");
    }
}

const finalApiKey = apiKey ? apiKey.trim() : "";
const genAI = new GoogleGenerativeAI(finalApiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`SUCCESS! Model ${modelName} responded:`, response.text());
        return true;
    } catch (error) {
        console.error(`FAILED ${modelName}:`);
        console.error(error.message);
        return false;
    }
}

async function runTests() {
    const modelsToTest = [
        "gemini-2.5-flash",
        "gemini-2.0-flash-exp"
    ];

    let success = false;
    for (const model of modelsToTest) {
        if (await testModel(model)) {
            success = true;
            break;
        }
    }

    if (!success) {
        console.log("\n--- DIAGNOSTIC RESULT: ALL FAILED ---");
    } else {
        console.log("\n--- DIAGNOSTIC RESULT: SUCCESS ---");
    }
}

if (apiKey) {
    runTests();
}
