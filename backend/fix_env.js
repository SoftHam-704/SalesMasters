const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
let content = fs.readFileSync(dotenvPath, 'utf8');

// Move OpenAI to the front
if (content.includes('AI_PROVIDER_ORDER=')) {
    content = content.replace(/AI_PROVIDER_ORDER=.*/, 'AI_PROVIDER_ORDER=openai,gemini,claude');
}

fs.writeFileSync(dotenvPath, content);
console.log('Updated provider order: OpenAI first.');
