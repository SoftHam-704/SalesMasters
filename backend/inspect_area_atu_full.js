const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/area_atu.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Available sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`\n=== Sheet: ${sheetName} ===`);
    console.log(`Total rows: ${data.length}`);

    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('Sample rows:', data.slice(1, 4));
    }
});
