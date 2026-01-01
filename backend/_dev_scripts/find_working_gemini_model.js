require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Testa TODOS os modelos possíveis do Gemini para encontrar quais funcionam
 */
async function findWorkingGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada no .env');
        return;
    }

    console.log('🔑 API Key:', apiKey.substring(0, 15) + '...');
    console.log('');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Lista abrangente de TODOS os modelos possíveis
    const allPossibleModels = [
        // Gemini 2.0
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",

        // Gemini 1.5 (variações)
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash-8b-latest",
        "gemini-1.5-flash-8b-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",

        // Gemini Pro (legacy)
        "gemini-pro",
        "gemini-pro-latest",
        "gemini-pro-vision",

        // Gemini 1.0
        "gemini-1.0-pro",
        "gemini-1.0-pro-latest",
        "gemini-1.0-pro-001",
        "gemini-1.0-pro-vision",
        "gemini-1.0-pro-vision-latest",

        // Experimental
        "gemini-exp-1114",
        "gemini-exp-1121",
        "gemini-exp-1206",

        // Text variants
        "text-embedding-004",
        "embedding-001"
    ];

    console.log(`🧪 TESTANDO ${allPossibleModels.length} MODELOS GEMINI\n`);
    console.log('='.repeat(70));

    const workingModels = [];
    const failedModels = [];

    for (const modelName of allPossibleModels) {
        try {
            console.log(`\n🔍 ${modelName}...`);

            const model = genAI.getGenerativeModel({ model: modelName });

            // Teste simples
            const result = await model.generateContent("Say OK");
            const response = await result.response;
            const text = response.text();

            console.log(`   ✅ FUNCIONA! Resposta: "${text.substring(0, 50)}"`);
            workingModels.push({
                name: modelName,
                response: text.trim()
            });

        } catch (error) {
            const errorMsg = error.message;
            console.log(`   ❌ Falhou: ${errorMsg.substring(0, 80)}`);
            failedModels.push({
                name: modelName,
                error: errorMsg
            });
        }

        // Pequeno delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTADOS FINAIS\n');

    if (workingModels.length > 0) {
        console.log(`✅ MODELOS QUE FUNCIONAM (${workingModels.length}):\n`);
        workingModels.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.name}`);
            console.log(`      Resposta: "${m.response}"`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('\n💡 RECOMENDAÇÃO:\n');
        console.log(`   USE O MODELO: "${workingModels[0].name}"`);
        console.log('\n   Atualize utils/ai_providers.js linha 93:');
        console.log(`   model: "${workingModels[0].name}"`);
        console.log('');

    } else {
        console.log('❌ NENHUM MODELO FUNCIONOU\n');
        console.log('Possíveis causas:');
        console.log('1. API key inválida ou expirada');
        console.log('2. Conta Google AI Studio sem acesso aos modelos');
        console.log('3. Região geográfica bloqueada');
        console.log('');
        console.log('SOLUÇÃO:');
        console.log('1. Acesse: https://aistudio.google.com/app/apikey');
        console.log('2. Delete a key antiga');
        console.log('3. Crie uma nova API key');
        console.log('4. Copie e cole no .env');
        console.log('');
        console.log('OU considere usar OpenAI/Claude como alternativa.');
    }

    console.log('');
}

findWorkingGeminiModels().catch(console.error);
