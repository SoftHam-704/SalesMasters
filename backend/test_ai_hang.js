const { getWorkingProvider } = require('./utils/ai_providers');
require('dotenv').config();

async function test() {
    console.log('Testing AI Provider...');
    try {
        const provider = await getWorkingProvider();
        console.log('Provider found:', provider.name);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

test();
