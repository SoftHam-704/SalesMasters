require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada no .env');
        return;
    }

    console.log('🔑 API Key detectada:', apiKey.substring(0, 10) + '...');
    console.log('');

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash-8b-latest",
        "gemini-pro-vision"
    ];

    console.log('🧪 TESTANDO MODELOS GEMINI\n');
    console.log('='.repeat(60));

    const workingModels = [];
    const failedModels = [];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\n🔍 Testando: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent("Diga apenas 'OK'");
            const response = await result.response;
            const text = response.text();

            console.log(`✅ ${modelName}: FUNCIONA`);
            console.log(`   Resposta: ${text.trim()}`);
            workingModels.push(modelName);

        } catch (error) {
            console.log(`❌ ${modelName}: FALHOU`);
            console.log(`   Erro: ${error.message}`);
            failedModels.push({ model: modelName, error: error.message });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO DOS TESTES:\n');

    if (workingModels.length > 0) {
        console.log(`✅ Modelos que FUNCIONAM (${workingModels.length}):`);
        workingModels.forEach(m => console.log(`   - ${m}`));
    } else {
        console.log('❌ Nenhum modelo funcionou');
    }

    console.log('');

    if (failedModels.length > 0) {
        console.log(`❌ Modelos que FALHARAM (${failedModels.length}):`);
        failedModels.forEach(f => console.log(`   - ${f.model}: ${f.error}`));
    }

    console.log('\n' + '='.repeat(60));

    if (workingModels.length > 0) {
        console.log('\n💡 RECOMENDAÇÃO:');
        console.log(`   Use o modelo: "${workingModels[0]}"`);
        console.log('\n   Atualize ia_order_endpoints.js linha 50:');
        console.log(`   model: "${workingModels[0]}"`);
    } else {
        console.log('\n⚠️ AÇÃO NECESSÁRIA:');
        console.log('   1. Verifique se a API key está correta');
        console.log('   2. Acesse https://aistudio.google.com/app/apikey');
        console.log('   3. Gere uma nova API key se necessário');
        console.log('   4. Ou implemente fallback sem IA (parsing tradicional)');
    }

    console.log('');
}

testModels().catch(console.error);
