const XLSX = require('xlsx');
const path = require('path');

try {
    const filePath = path.join('e:', 'Sistemas_ia', 'SalesMasters', 'data', 'fornecedores.xlsx');
    console.log('Reading:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('Total rows in XLSX:', data.length);
} catch (e) {
    console.error('Error reading XLSX:', e.message);
}
