const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
const workbook = XLSX.readFile(filePath);
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

console.log('Primeiras 3 linhas:');
console.table(data.slice(0, 3));

console.log('\nColunas disponíveis:');
console.log(Object.keys(data[0]));
