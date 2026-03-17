const fs = require('fs');
const path = require('path');

const files = [
    'e:/Sistemas_ia/SalesMasters/data/pedidos.json',
    'e:/Sistemas_ia/SalesMasters/data/itens_ped.json'
];

files.forEach(file => {
    console.log(`\n--- Inspecting ${file} ---`);
    try {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        console.log('Type of data:', typeof data);
        if (Array.isArray(data)) {
            console.log('Is Array, Length:', data.length);
            console.log('First Item:', JSON.stringify(data[0], null, 2));
        } else {
            const keys = Object.keys(data);
            console.log('Keys:', keys);
            if (keys.length > 0) {
                const firstKey = keys[0];
                console.log(`Type of data['${firstKey}']:`, typeof data[firstKey]);
                if (Array.isArray(data[firstKey])) {
                    console.log(`Length of data['${firstKey}']:`, data[firstKey].length);
                    console.log(`First item in data['${firstKey}']:`, JSON.stringify(data[firstKey][0], null, 2));
                }
            }
        }
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
