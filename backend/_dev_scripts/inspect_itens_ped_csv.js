// ============================================================================
// SalesMasters - Inspect ITENS_PED CSV Structure
// Execute this with: node inspect_itens_ped_csv.js
// ============================================================================

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function inspectCSV() {
    try {
        console.log('\n========================================');
        console.log('  Inspecting ITENS_PED.CSV Structure');
        console.log('========================================\n');

        const csvPath = path.join(__dirname, '..', 'data', 'itens_ped.csv');
        console.log(`📂 Reading file: ${csvPath}\n`);

        let rowCount = 0;
        let firstRow = null;

        const stream = fs.createReadStream(csvPath)
            .pipe(csv({ separator: ';' }));

        for await (const row of stream) {
            rowCount++;

            if (rowCount === 1) {
                firstRow = row;
                console.log('📋 Column names found in CSV:\n');
                const columns = Object.keys(row);
                columns.forEach((col, idx) => {
                    const value = row[col];
                    const preview = value ? String(value).substring(0, 40) : 'NULL';
                    console.log(`${idx + 1}. "${col}" = ${preview}`);
                });
                console.log(`\n📊 Total columns: ${columns.length}\n`);
            }

            if (rowCount >= 3) break; // Just read first few rows
        }

        console.log(`📊 Sample rows read: ${rowCount}\n`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nFull error:', error);
    }
}

inspectCSV();
