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

console.log('\n=== GRUPO.XLSX ===');
const grupoPath = path.join(__dirname, '../data/grupo.xlsx');
const grupoWb = XLSX.readFile(grupoPath);
console.log('Sheets:', grupoWb.SheetNames);

const grupoSheet = grupoWb.Sheets[grupoWb.SheetNames[0]];
const grupoData = XLSX.utils.sheet_to_json(grupoSheet, { header: 1 });
console.log(`Total rows: ${grupoData.length}`);
console.log('Headers:', grupoData[0]);
console.log('Sample rows:');
grupoData.slice(1, 4).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});
