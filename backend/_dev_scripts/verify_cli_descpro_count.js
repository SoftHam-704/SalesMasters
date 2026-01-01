const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
const workbook = XLSX.readFile(filePath);
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

console.log(`Total de registros na planilha: ${data.length}`);
console.log('\nPrimeiros 5 registros:');
console.table(data.slice(0, 5).map(r => ({
    cli_codigo: r.CLI_CODIGO,
    cli_forcodigo: r.CLI_FORCODIGO,
    cli_grupo: r.CLI_GRUPO
})));

console.log('\nÚltimos 5 registros:');
console.table(data.slice(-5).map(r => ({
    cli_codigo: r.CLI_CODIGO,
    cli_forcodigo: r.CLI_FORCODIGO,
    cli_grupo: r.CLI_GRUPO
})));
