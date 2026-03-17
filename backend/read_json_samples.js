const fs = require('fs');
const path = require('path');

const files = [
    'e:/Sistemas_ia/SalesMasters/data/pedidos.json',
    'e:/Sistemas_ia/SalesMasters/data/itens_ped.json'
];

files.forEach(file => {
    console.log(`\n--- First 2 items of ${file} ---`);
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(JSON.stringify(data.slice(0, 2), null, 2));
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
