const XLSX = require('xlsx');
const path = require('path');

try {
    const workbook = XLSX.readFile('C:\\SalesMasters\\Dados\\fornecedores.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('Total rows in XLSX:', data.length);
} catch (e) {
    console.error('Error reading XLSX:', e.message);
}
