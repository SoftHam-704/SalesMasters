const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/area_atu.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers and first few rows
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, limit: 5 });

    console.log("File Path:", filePath);
    console.log("Headers:", data[0]);
    console.log("First 3 rows of data:");
    console.log(JSON.stringify(data.slice(1, 4), null, 2));

} catch (error) {
    console.error("Error reading file:", error.message);
}
