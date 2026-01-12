const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
let content = fs.readFileSync(dotenvPath, 'utf8');

// Fix OpenAI API Key split across lines
// We find the key line and join it with the NEXT line if it looks like part of the key
const lines = content.split(/\r?\n/);
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('OPENAI_API_KEY=') && !line.includes('"')) {
        // Look ahead to see if the next line is a continuation (no = sign, no common env var patterns)
        while (i + 1 < lines.length &&
            lines[i + 1].trim() !== '' &&
            !lines[i + 1].includes('=') &&
            !lines[i + 1].startsWith('#')) {
            line += lines[i + 1].trim();
            i++;
        }
    }
    newLines.push(line);
}

let newContent = newLines.join('\n');

// Ensure provider order
if (newContent.includes('AI_PROVIDER_ORDER=')) {
    newContent = newContent.replace(/AI_PROVIDER_ORDER=.*/, 'AI_PROVIDER_ORDER=openai,gemini,claude');
}

fs.writeFileSync(dotenvPath, newContent);
console.log('Fixed .env file: OpenAI key joined and order set.');
