const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('e:\\Sistemas_ia\\SalesMasters\\data', 'transportadoras.xlsx');
try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log("Headers:", Object.keys(data[0]));
    console.log("First Row:", data[0]);
    console.log("Count:", data.length);
} catch (e) {
    console.error("Error reading file:", e.message);
}
