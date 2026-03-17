const fs = require('fs');

async function analyzeJson() {
    console.log('📖 Reading JSON...');
    const dataPath = 'e:/Sistemas_ia/SalesMasters/data/produtos.json';
    let rawData = fs.readFileSync(dataPath, 'utf8');
    rawData = rawData.replace(/:\s*False/g, ': false').replace(/:\s*True/g, ': true');
    const jsonData = JSON.parse(rawData);
    const records = jsonData.RecordSet;
    console.log(`Total records: ${records.length}`);

    const tables = new Set();
    const indTables = {}; // industry -> tables

    records.forEach(r => {
        const table = r.PRO_NOMETABELA || 'PADRAO';
        tables.add(table);
        if (!indTables[r.PRO_INDUSTRIA]) indTables[r.PRO_INDUSTRIA] = new Set();
        indTables[r.PRO_INDUSTRIA].add(table);
    });

    console.log(`Total unique table names: ${tables.size}`);
    console.log('Industries and their tables:');
    for (const ind in indTables) {
        console.log(`Ind ${ind}: ${Array.from(indTables[ind]).join(', ')}`);
    }

    // Check for a sample product with multiple tables
    const prodCounts = {};
    for (const r of records) {
        prodCounts[r.PRO_CODIGO] = (prodCounts[r.PRO_CODIGO] || 0) + 1;
        if (prodCounts[r.PRO_CODIGO] > 1) {
            console.log(`Sample product with 1+ tables: PRO_CODIGO ${r.PRO_CODIGO}`);
            const samples = records.filter(x => x.PRO_CODIGO === r.PRO_CODIGO);
            samples.forEach(s => console.log(` - Table: ${s.PRO_NOMETABELA}, Price: ${s.PRO_VALORNORMAL}`));
            break;
        }
    }
}

analyzeJson();
