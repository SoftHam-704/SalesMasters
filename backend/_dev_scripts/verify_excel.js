const XLSX = require('xlsx');
const path = require('path');

const filePath = 'E:\\Sistemas_ia\\SalesMasters\\pedidos\\pedidoteste.xlsx';

try {
    console.log('Reading file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Sheet Name:', sheetName);
    console.log('Total Rows:', data.length);

    let validItems = 0;
    const items = [];

    for (let i = 0; i < Math.min(data.length, 5); i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }

    for (const row of data) {
        if (row.length < 2) continue;
        const col0 = row[0]?.toString().trim();
        const qty = parseFloat(row[1]);

        if (col0 && !isNaN(qty)) {
            validItems++;
            items.push({ code: col0, qty: qty });
        }
    }

    console.log('--- ANALYSIS ---');
    console.log('Found valid items:', validItems);
    if (validItems > 0) {
        console.log('First 3 items:', items.slice(0, 3));
        console.log('SUCCESS: File seems compatible.');
    } else {
        console.log('FAILURE: No valid items found. Expected Col A = Code, Col B = Quantity (number).');
    }

} catch (e) {
    console.error('Error:', e.message);
}
