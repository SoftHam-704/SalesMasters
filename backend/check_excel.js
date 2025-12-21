// Script para verificar estrutura do cad_prod.xlsx
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cad_prod.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('📋 Abas encontradas:', workbook.SheetNames);
console.log('');

workbook.SheetNames.forEach((sheetName, idx) => {
    const worksheet = workbook.Sheets[sheetName];

    // Pegar range da planilha
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const totalRows = range.e.r - range.s.r + 1;

    // Ler dados
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`Aba ${idx + 1}: "${sheetName}"`);
    console.log(`  Range: ${worksheet['!ref']}`);
    console.log(`  Total de linhas (incluindo cabeçalho): ${totalRows}`);
    console.log(`  Registros com dados: ${data.length}`);

    if (data.length > 0) {
        console.log(`  Colunas:`, Object.keys(data[0]));
        console.log(`  Primeiro registro:`, data[0]);
    }
    console.log('');
});
