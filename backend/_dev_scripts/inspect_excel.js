const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filename = 'itens_ped_2020.xlsx';
const filePath = path.join(__dirname, '../data', filename);

console.log(`Inspecting ${filename}...`);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { limit: 1 });

console.log('First row keys:', Object.keys(data[0]));
console.log('First row data:', data[0]);
