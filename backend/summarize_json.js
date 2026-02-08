const fs = require('fs');

async function checkUniqueness() {
    try {
        const data = JSON.parse(fs.readFileSync('e:/Sistemas_ia/SalesMasters/data/itens_ped.json', 'utf8'));
        const lanctos = new Set();
        let duplicates = 0;
        data.RecordSet.forEach(item => {
            if (lanctos.has(item.ITE_LANCTO)) duplicates++;
            lanctos.add(item.ITE_LANCTO);
        });
        console.log('Total items:', data.RecordSet.length);
        console.log('Duplicate ITE_LANCTO:', duplicates);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkUniqueness();
