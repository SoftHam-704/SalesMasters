const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = ['regioes.xlsx', 'cidades_regioes.xlsx'];

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n--- Inspecting ${file} ---`);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length > 0) {
            console.log('Headers:', data[0]);
            console.log('Row 1:', data[1]);
        } else {
            console.log('File is empty.');
        }
    } else {
        console.log(`\nFile ${file} not found.`);
    }
});
