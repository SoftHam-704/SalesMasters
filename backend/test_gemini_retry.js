require('dotenv').config();
const { GeminiProvider } = require('./utils/ai_providers');

async function test() {
    const provider = new GeminiProvider();
    try {
        const ok = await provider.test();
        console.log('Gemini Test:', ok ? 'SUCCESS' : 'FAILED');
    } catch (error) {
        console.error('Gemini Test Error:', error.message);
    }
}

test();
