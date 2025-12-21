const xlsx = require('xlsx');
const path = require('path');

// Adjusted path: Go up one level from backend, then into data
const filePath = path.join(__dirname, '..', 'data', 'cli_ind.xlsx');
console.log('Reading file from:', filePath);

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length > 0) {
        console.log('Headers:', JSON.stringify(jsonData[0]));
        if (jsonData.length > 1) {
            console.log('First Row:', JSON.stringify(jsonData[1]));
        }
    } else {
        console.log('Empty file');
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
