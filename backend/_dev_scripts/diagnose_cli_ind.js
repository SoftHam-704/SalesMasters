require('dotenv').config();
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_ind.xlsx');
console.log('📂 Lendo arquivo:', filePath);

const workbook = XLSX.readFile(filePath);
console.log(`📋 Abas encontradas: ${workbook.SheetNames.join(', ')}\n`);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log(`\n${sheetName}:`);
    console.log(`  Intervalo: ${sheet['!ref']}`);
    console.log(`  Linhas: ${range.e.r + 1} (de ${range.s.r} a ${range.e.r})`);
    console.log(`  Colunas: ${range.e.c + 1}`);

    const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.log(`  Registros (JSON): ${data.length}`);

    // Show first 3 rows
    console.log(`\n  Primeiras 3 linhas:`);
    data.slice(0, 3).forEach((row, i) => {
        console.log(`    ${i + 1}:`, row);
    });
}
