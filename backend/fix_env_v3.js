const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
let content = fs.readFileSync(dotenvPath, 'utf8');

// The specific key we saw in the terminal output
const NEW_OPENAI_KEY = 'sk-PLACEHOLDER-KEY-HERE';

// Remove any newlines between them
const fullKey = NEW_OPENAI_KEY;

// Aggressive replacement
content = content.replace(new RegExp(keyPart1 + '\\s+' + keyPart2, 'g'), fullKey);
// Also try without whitespaces if it's strictly joined in some views
content = content.replace(new RegExp(keyPart1 + '[\\r\\n]+' + keyPart2, 'g'), fullKey);

fs.writeFileSync(dotenvPath, content);
console.log('Aggressively fixed OpenAI key in .env');
