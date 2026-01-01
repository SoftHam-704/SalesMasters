const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Abas disponíveis:', workbook.SheetNames);
console.log('\nLendo da primeira aba:', workbook.SheetNames[0]);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const range = XLSX.utils.decode_range(sheet['!ref']);

console.log(`\nRange da planilha: ${sheet['!ref']}`);
console.log(`Linhas: ${range.e.r + 1} (de ${range.s.r} até ${range.e.r})`);
console.log(`Colunas: ${range.e.c + 1} (de ${range.s.c} até ${range.e.c})`);

const data = XLSX.utils.sheet_to_json(sheet);
console.log(`\nRegistros lidos: ${data.length}`);

if (data.length > 0) {
    console.log('\nPrimeiro registro:');
    console.log(data[0]);

    console.log('\nÚltimo registro:');
    console.log(data[data.length - 1]);
}
