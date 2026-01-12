const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
let content = fs.readFileSync(dotenvPath, 'utf8');

// The specific key we saw in the terminal output
const keyPart1 = "sk-proj-xd1j5MEZz9EW2gG4Xe3CY6CERS_jmgphCF2CsNUHwBjqJ1F-p8SvyceeGkW8gKx9-e8sSYxJgjT3BlbkFJ3";
const keyPart2 = "9nKtf5MCqtDGYR8V2-4A8w1bGqqJZ55xSOXVYk-HoOVOLtmT0_L63tb4pEwRwGAMxKHTD-bUA";

// Remove any newlines between them
const fullKey = keyPart1 + keyPart2;

// Aggressive replacement
content = content.replace(new RegExp(keyPart1 + '\\s+' + keyPart2, 'g'), fullKey);
// Also try without whitespaces if it's strictly joined in some views
content = content.replace(new RegExp(keyPart1 + '[\\r\\n]+' + keyPart2, 'g'), fullKey);

fs.writeFileSync(dotenvPath, content);
console.log('Aggressively fixed OpenAI key in .env');
