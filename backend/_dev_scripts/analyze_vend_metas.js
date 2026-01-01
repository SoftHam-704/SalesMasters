const XLSX = require('xlsx');
const path = require('path');

async function analyzeVendMetas() {
    try {
        console.log('📂 Analisando vend_metas.xlsx...\n');

        const filePath = path.join(__dirname, '../data/vend_metas.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total na planilha: ${data.length} registros\n`);
        console.log('📋 Colunas da planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));

            console.log('\n📊 Amostra (primeiro registro):');
            console.log(data[0]);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

analyzeVendMetas();
