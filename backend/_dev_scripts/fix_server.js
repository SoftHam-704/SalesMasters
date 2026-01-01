const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Find and remove the old industries endpoint (lines ~1293-1316)
const startMarker = '// ============================================\n// DADOS NAS INDÚSTRIAS (cli_ind)\n// ============================================';
const endMarker = '});\n\n\n// Listar todas as transportadoras';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    // Remove the old endpoint block
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    content = before + after;

    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('✅ Endpoint antigo removido com sucesso!');
    console.log('📝 Agora execute: node server.js');
} else {
    console.log('⚠️  Marcadores não encontrados. Tentando abordagem alternativa...');

    // Alternative: remove by line pattern
    const lines = content.split('\n');
    const newLines = [];
    let skip = false;
    let skipCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Start skipping at the old endpoint
        if (line.includes('// DADOS NAS INDÚSTRIAS (cli_ind)')) {
            skip = true;
            continue;
        }

        // Stop skipping after the endpoint closes
        if (skip && line.includes('// Listar todas as transportadoras')) {
            skip = false;
        }

        if (!skip) {
            newLines.push(line);
        } else {
            skipCount++;
        }
    }

    if (skipCount > 0) {
        fs.writeFileSync(serverPath, newLines.join('\n'), 'utf8');
        console.log(`✅ Removidas ${skipCount} linhas do endpoint antigo!`);
        console.log('📝 Agora execute: node server.js');
    } else {
        console.log('❌ Não foi possível encontrar o endpoint antigo.');
        console.log('Por favor, remova manualmente as linhas 1293-1316 do server.js');
    }
}
