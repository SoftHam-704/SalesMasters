const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function analyzeCliInd() {
    try {
        console.log('📂 Analisando cli_ind.xlsx e tabela...\n');

        // Ler planilha
        const filePath = path.join(__dirname, '../data/cli_ind.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total na planilha: ${data.length} registros\n`);
        console.log('📋 Colunas da planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));
        }

        console.log('\n🔍 Schema da tabela cli_ind:');
        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'cli_ind'
            ORDER BY ordinal_position
        `);
        schema.rows.forEach((c, i) => {
            console.log(`   ${(i + 1).toString().padStart(2)}. ${c.column_name.padEnd(25)} ${c.data_type.padEnd(20)} ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n📊 Amostra (primeiros 2 registros):');
        console.table(data.slice(0, 2));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeCliInd();
