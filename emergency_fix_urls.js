const fs = require('fs');
const path = require('path');

// URLs de produção
const PROD_NODE_URL = 'https://salesmasters.softham.com.br';
const PROD_BI_URL = 'https://salesmasters.softham.com.br/bi-api';

// URLs de desenvolvimento (para substituir)
const DEV_NODE_URL = 'http://localhost:3005';
const DEV_NODE_URL_HTTPS = 'https://localhost:3005';
const DEV_BI_URL = 'http://localhost:8000';
const DEV_BI_URL_HTTPS = 'https://localhost:8000';

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
                walkDir(filePath);
            }
        } else {
            if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
                replaceInFile(filePath);
            }
        }
    });
}

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Substituir Node API (localhost:3005)
    if (content.includes(DEV_NODE_URL)) {
        content = content.split(DEV_NODE_URL).join(PROD_NODE_URL);
        changed = true;
    }
    if (content.includes(DEV_NODE_URL_HTTPS)) {
        content = content.split(DEV_NODE_URL_HTTPS).join(PROD_NODE_URL);
        changed = true;
    }

    // 2. Substituir BI API (localhost:8000)
    // CUIDADO: Substituir pela rota do Proxy (/bi-api)
    if (content.includes(DEV_BI_URL)) {
        content = content.split(DEV_BI_URL).join(PROD_BI_URL);
        changed = true;
    }
    if (content.includes(DEV_BI_URL_HTTPS)) {
        content = content.split(DEV_BI_URL_HTTPS).join(PROD_BI_URL);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corrigido (BI/Node): ${filePath}`);
    }
}

console.log('🚀 Iniciando varredura FINAL de URLs (Node + BI)...');
walkDir('./frontend/src');
console.log('🏁 Concluído! Agora rode o build.');
