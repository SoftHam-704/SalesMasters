const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/indclientes.xlsx');
const workbook = XLSX.readFile(filePath, { sheetRows: 0 });
const data = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);

console.log(`Total: ${data.length} registros\n`);
console.log('Primeiras 3 linhas:');
console.table(data.slice(0, 3));

console.log('\nColunas disponíveis:');
console.log(Object.keys(data[0]));
