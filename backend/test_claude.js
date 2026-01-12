require('dotenv').config();
const { ClaudeProvider } = require('./utils/ai_providers');

async function test() {
    const provider = new ClaudeProvider();
    try {
        const ok = await provider.test();
        console.log('Claude Test:', ok ? 'SUCCESS' : 'FAILED');
    } catch (error) {
        console.error('Claude Test Error:', error.message);
    }
}

test();
