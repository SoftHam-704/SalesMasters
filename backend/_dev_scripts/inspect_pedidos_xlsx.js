// ============================================================================
// SalesMasters - Inspect PEDIDOS XLSX Structure
// Execute this with: node inspect_pedidos_xlsx.js
// ============================================================================

const XLSX = require('xlsx');
const path = require('path');

async function inspectXLSX() {
    try {
        console.log('\n========================================');
        console.log('  Inspecting PEDIDOS.XLSX Structure');
        console.log('========================================\n');

        const xlsxPath = path.join(__dirname, '..', 'data', 'pedidos.xlsx');
        console.log(`📂 Reading file: ${xlsxPath}\n`);

        const workbook = XLSX.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Sheet name: ${sheetName}\n`);

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Total rows: ${data.length}\n`);

        if (data.length > 0) {
            console.log('📋 Column names found in Excel:\n');
            const columns = Object.keys(data[0]);
            columns.forEach((col, idx) => {
                const sampleValue = data[0][col];
                const valueType = typeof sampleValue;
                const valuePreview = sampleValue !== null && sampleValue !== undefined
                    ? String(sampleValue).substring(0, 30)
                    : 'NULL';
                console.log(`${idx + 1}. "${col}" (${valueType}) = ${valuePreview}`);
            });

            console.log(`\n📊 Total columns: ${columns.length}\n`);

            console.log('========================================');
            console.log('  Sample Row (first record):');
            console.log('========================================\n');
            console.log(JSON.stringify(data[0], null, 2));
        }

        console.log('\n========================================\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nFull error:', error);
    }
}

inspectXLSX();
