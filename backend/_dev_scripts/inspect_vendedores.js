const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('e:\\Sistemas_ia\\SalesMasters\\data', 'vendedores.xlsx');
console.log(`Lendo arquivo: ${filePath}`);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get headers
const headers = [];
const range = XLSX.utils.decode_range(worksheet['!ref']);
const R = range.s.r;
for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
    if (cell && cell.v) headers.push(cell.v);
}

console.log('Headers encontrados:', headers);

// Get first row of data
const data = XLSX.utils.sheet_to_json(worksheet, { header: headers, range: 1 });
if (data.length > 0) {
    console.log('Exemplo de dados (primeira linha):', data[0]);
} else {
    console.log('Nenhum dado encontrado.');
}
