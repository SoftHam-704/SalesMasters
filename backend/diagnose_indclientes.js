const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/indclientes.xlsx');
console.log('Lendo arquivo:', filePath);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get range
const range = XLSX.utils.decode_range(sheet['!ref']);
console.log('Intervalo da planilha:', sheet['!ref']);
console.log('Linhas:', range.e.r + 1);
console.log('Colunas:', range.e.c + 1);

// Print first 5 rows
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('\nPrimeiras 5 linhas (cabeçalho + dados):');
console.log(JSON.stringify(data.slice(0, 5), null, 2));

// Print specific row if many
if (data.length > 50) {
    console.log('\nLinha 50:', data[50]);
}

console.log('\nTotal de linhas lidas:', data.length);
