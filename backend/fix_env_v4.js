const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
const content = fs.readFileSync(dotenvPath, 'utf8');

// Join ANY line that doesn't start with a key Pattern
const lines = content.split(/\r?\n/);
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
        fixedLines.push('');
        continue;
    }

    // If it looks like a key=value
    if (line.includes('=') && (line.match(/^[A-Z_]+=/))) {
        fixedLines.push(line);
    } else {
        // It's a continuation of the previous line
        if (fixedLines.length > 0) {
            fixedLines[fixedLines.length - 1] += line;
        } else {
            fixedLines.push(line);
        }
    }
}

fs.writeFileSync(dotenvPath, fixedLines.join('\n'));
console.log('Fixed .env by joining continuations. New line count:', fixedLines.length);
