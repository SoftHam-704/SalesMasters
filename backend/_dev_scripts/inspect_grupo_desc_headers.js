const XLSX = require('xlsx');
const path = require('path');

try {
    const filePath = path.join(__dirname, '../data/grupo_desc.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers
    const headers = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const R = range.s.r; // Start Row

    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: R })];
        if (cell && cell.v) headers.push(cell.v);
    }

    console.log('Headers found:', headers);

    const data = XLSX.utils.sheet_to_json(worksheet);
    if (data.length > 0) {
        console.log('First row sample:', data[0]);
    }

} catch (err) {
    console.error('Error:', err.message);
}
