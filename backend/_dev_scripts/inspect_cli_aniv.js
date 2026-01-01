const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('e:\\Sistemas_ia\\SalesMasters\\data\\cli_aniv.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Headers:', jsonData[0]);
    console.log('First Row:', jsonData[1]);
} catch (error) {
    console.error('Error reading file:', error.message);
}
