const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Available sheets:', workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`\nTotal rows: ${data.length}`);
console.log('Headers:', data[0]);
console.log('\nSample rows:');
data.slice(1, 6).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});
