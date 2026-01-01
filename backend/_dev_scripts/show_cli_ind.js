const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_ind.xlsx');
console.log('📂 Arquivo:', filePath, '\n');

const workbook = XLSX.readFile(filePath);

// Read all sheets
for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (data.length === 0) {
        console.log(`${sheetName}: (vazia)\n`);
        continue;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`ABA: ${sheetName} - ${data.length} registros`);
    console.log('='.repeat(80));

    // Show all data
    data.forEach((row, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log(`  CLI_LANCAMENTO: ${row.CLI_LANCAMENTO || 'null'}`);
        console.log(`  CLI_CODIGO: ${row.CLI_CODIGO}`);
        console.log(`  CLI_FORCODIGO: ${row.CLI_FORCODIGO}`);
        console.log(`  CLI_DESC1: ${row.CLI_DESC1 || 0}`);
        console.log(`  CLI_DESC2: ${row.CLI_DESC2 || 0}`);
        console.log(`  CLI_DESC3: ${row.CLI_DESC3 || 0}`);
        console.log(`  CLI_TRANSPORTADORA: ${row.CLI_TRANSPORTADORA || 'null'}`);
        console.log(`  CLI_GRUPODESC: ${row.CLI_GRUPODESC || 'null'}`);
    });
}

console.log('\n' + '='.repeat(80));
