const XLSX = require('xlsx');
const path = require('path');

console.log('=== GRUPO_DESC.XLSX ===');
const grupoDescPath = path.join(__dirname, '../data/grupo_desc.xlsx');
const grupoDescWb = XLSX.readFile(grupoDescPath);
console.log('Sheets:', grupoDescWb.SheetNames);

const grupoDescSheet = grupoDescWb.Sheets[grupoDescWb.SheetNames[0]];
const grupoDescData = XLSX.utils.sheet_to_json(grupoDescSheet, { header: 1 });
console.log(`Total rows: ${grupoDescData.length}`);
console.log('Headers:', grupoDescData[0]);
console.log('Sample rows:');
grupoDescData.slice(1, 4).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});

console.log('\n=== GRUPOS.XLSX ===');
const gruposPath = path.join(__dirname, '../data/grupos.xlsx');
const gruposWb = XLSX.readFile(gruposPath);
console.log('Sheets:', gruposWb.SheetNames);

const gruposSheet = gruposWb.Sheets[gruposWb.SheetNames[0]];
const gruposData = XLSX.utils.sheet_to_json(gruposSheet, { header: 1 });
console.log(`Total rows: ${gruposData.length}`);
console.log('Headers:', gruposData[0]);
console.log('Sample rows:');
gruposData.slice(1, 4).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});
