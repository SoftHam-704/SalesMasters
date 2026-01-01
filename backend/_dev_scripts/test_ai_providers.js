require('dotenv').config();

/**
 * Test script for multiple AI providers
 * Tests: Gemini, Claude (Anthropic), OpenAI
 */

async function testGemini() {
    console.log('\n🔵 TESTANDO GEMINI (Google)');
    console.log('='.repeat(60));

    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.log('❌ GEMINI_API_KEY não configurada');
            return { provider: 'Gemini', success: false, error: 'No API key' };
        }

        console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try gemini-1.5-flash first (most common)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent([
            'Return only this JSON: {"test": "success", "provider": "Gemini"}'
        ]);

        const response = await result.response;
        const text = response.text();
        const data = JSON.parse(text);

        console.log('✅ Gemini FUNCIONANDO');
        console.log('📝 Resposta:', data);
        console.log('🎯 Modelo recomendado: gemini-1.5-flash');

        return { provider: 'Gemini', success: true, model: 'gemini-1.5-flash' };

    } catch (error) {
        console.log('❌ Gemini FALHOU:', error.message);
        return { provider: 'Gemini', success: false, error: error.message };
    }
}

async function testClaude() {
    console.log('\n🟣 TESTANDO CLAUDE (Anthropic)');
    console.log('='.repeat(60));

    try {
        const Anthropic = require('@anthropic-ai/sdk');
        const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            console.log('❌ CLAUDE_API_KEY não configurada');
            return { provider: 'Claude', success: false, error: 'No API key' };
        }

        console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
        const anthropic = new Anthropic({ apiKey });

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 100,
            messages: [{
                role: "user",
                content: 'Return only this JSON: {"test": "success", "provider": "Claude"}'
            }]
        });

        const text = message.content[0].text;
        console.log('✅ Claude FUNCIONANDO');
        console.log('📝 Resposta:', text);
        console.log('🎯 Modelo recomendado: claude-3-5-sonnet-20241022');

        return { provider: 'Claude', success: true, model: 'claude-3-5-sonnet-20241022' };

    } catch (error) {
        console.log('❌ Claude FALHOU:', error.message);
        return { provider: 'Claude', success: false, error: error.message };
    }
}

async function testOpenAI() {
    console.log('\n🟢 TESTANDO OPENAI (GPT)');
    console.log('='.repeat(60));

    try {
        const OpenAI = require('openai');
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.log('❌ OPENAI_API_KEY não configurada');
            return { provider: 'OpenAI', success: false, error: 'No API key' };
        }

        console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: 'Return only this JSON: {"test": "success", "provider": "OpenAI"}'
            }],
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content;
        const data = JSON.parse(text);

        console.log('✅ OpenAI FUNCIONANDO');
        console.log('📝 Resposta:', data);
        console.log('🎯 Modelo recomendado: gpt-4o-mini (rápido e barato)');

        return { provider: 'OpenAI', success: true, model: 'gpt-4o-mini' };

    } catch (error) {
        console.log('❌ OpenAI FALHOU:', error.message);
        return { provider: 'OpenAI', success: false, error: error.message };
    }
}

async function main() {
    console.log('🤖 TESTE DE PROVEDORES DE IA');
    console.log('='.repeat(60));
    console.log('Testando: Gemini, Claude, OpenAI\n');

    const results = [];

    // Test all providers
    results.push(await testGemini());
    results.push(await testClaude());
    results.push(await testOpenAI());

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO FINAL\n');

    const working = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (working.length > 0) {
        console.log(`✅ Provedores FUNCIONANDO (${working.length}):`);
        working.forEach(r => {
            console.log(`   🎯 ${r.provider}: ${r.model || 'OK'}`);
        });
    }

    if (failed.length > 0) {
        console.log(`\n❌ Provedores com PROBLEMAS (${failed.length}):`);
        failed.forEach(r => {
            console.log(`   ⚠️  ${r.provider}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (working.length > 0) {
        console.log('\n💡 RECOMENDAÇÃO:');
        console.log(`   Use ${working[0].provider} como provider primário`);
        if (working.length > 1) {
            console.log(`   Configure fallback: ${working.slice(1).map(r => r.provider).join(' → ')}`);
        }
    } else {
        console.log('\n⚠️ NENHUM PROVIDER FUNCIONANDO');
        console.log('   1. Verifique as API keys no arquivo .env');
        console.log('   2. Gere novas API keys:');
        console.log('      - Gemini: https://aistudio.google.com/app/apikey');
        console.log('      - Claude: https://console.anthropic.com/');
        console.log('      - OpenAI: https://platform.openai.com/api-keys');
    }

    console.log('');
}

main().catch(console.error);
