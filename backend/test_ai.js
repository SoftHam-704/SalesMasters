require('dotenv').config();
const { getWorkingProvider } = require('./utils/ai_providers');

async function test() {
    console.log('🚀 Starting AI Provider Test...');
    try {
        const provider = await getWorkingProvider();
        console.log(`✅ Success! Working provider: ${provider.name}`);

        console.log('📝 Testing processing... (simulated)');
        // Just testing connectivity for now
        process.exit(0);
    } catch (e) {
        console.error(`❌ Failed! Error: ${e.message}`);
        process.exit(1);
    }
}

test();
